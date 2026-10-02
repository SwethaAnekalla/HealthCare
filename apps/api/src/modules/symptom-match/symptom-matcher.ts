import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import axios from 'axios';

/**
 * Deterministic symptom-to-specialty matcher
 * Fallback implementation that works without API keys
 */
export const deterministicMatcher = {
  async match(symptoms: string) {
    // Parse symptoms and map to specialties using database knowledge base
    const symptomTokens = symptoms.toLowerCase().split(/[,\s]+/).filter((s) => s.length > 2);

    // Query database for matching specialties
    const symptomMatches = await prisma.symptomSpecialtyMap.findMany({
      where: {
        symptom: {
          name: {
            in: symptomTokens,
            mode: 'insensitive',
          },
        },
      },
      include: {
        specialty: { select: { id: true, name: true } },
        symptom: { select: { name: true, isRedFlag: true, redFlagGuidance: true } },
      },
    });

    // Aggregate by specialty
    const specialtyScores: Record<string, { name: string; confidence: number; reason: string }> = {};

    symptomMatches.forEach((sm) => {
      const sid = sm.specialty.id;
      if (!specialtyScores[sid]) {
        specialtyScores[sid] = {
          name: sm.specialty.name,
          confidence: 0,
          reason: '',
        };
      }
      specialtyScores[sid].confidence += sm.weight * 100;
      specialtyScores[sid].reason += `${sm.symptom.name}, `;
    });

    // Sort by confidence
    const rankedSpecialties = Object.values(specialtyScores)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map((s) => ({
        ...s,
        confidence: Math.min(Math.round(s.confidence), 100),
        reason: `Matches symptoms: ${s.reason.slice(0, -2)}`,
      }));

    // Check for red flags
    const redFlags = await prisma.symptom.findMany({
      where: {
        isRedFlag: true,
        name: {
          in: symptomTokens,
          mode: 'insensitive',
        },
      },
    });

    return {
      specialties: rankedSpecialties,
      redFlags: redFlags.map((rf) => ({
        symptom: rf.name,
        severity: 'CRITICAL',
        guidance: rf.redFlagGuidance || 'Seek emergency care immediately',
      })),
    };
  },
};

/**
 * LLM-powered symptom matcher (requires API key)
 */
export const llmMatcher = {
  async match(symptoms: string) {
    if (env.symptomMatcherProvider === 'anthropic' && env.anthropicApiKey) {
      return await this.matchWithAnthropic(symptoms);
    } else if (env.symptomMatcherProvider === 'openai' && env.openaiApiKey) {
      return await this.matchWithOpenAI(symptoms);
    } else {
      logger.warn('LLM provider not configured, falling back to deterministic matcher');
      return await deterministicMatcher.match(symptoms);
    }
  },

  async matchWithAnthropic(symptoms: string) {
    try {
      // This would call Anthropic API in production
      // For now, log and fall back
      logger.info('Anthropic symptom matching would be called here');
      return await deterministicMatcher.match(symptoms);
    } catch (error) {
      logger.error('Anthropic matching failed', error);
      return await deterministicMatcher.match(symptoms);
    }
  },

  async matchWithOpenAI(symptoms: string) {
    try {
      // This would call OpenAI API in production
      // For now, log and fall back
      logger.info('OpenAI symptom matching would be called here');
      return await deterministicMatcher.match(symptoms);
    } catch (error) {
      logger.error('OpenAI matching failed', error);
      return await deterministicMatcher.match(symptoms);
    }
  },
};

/**
 * Main symptom matcher that selects the appropriate implementation
 */
export const symptomMatcher = {
  async match(symptoms: string) {
    if (env.symptomMatcherProvider === 'deterministic') {
      return await deterministicMatcher.match(symptoms);
    } else {
      return await llmMatcher.match(symptoms);
    }
  },

  /**
   * Get doctors matching specialties
   */
  async getDoctorsForSpecialties(specialtyNames: string[], page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const specialties = await prisma.specialty.findMany({
      where: {
        name: { in: specialtyNames, mode: 'insensitive' },
      },
    });

    if (specialties.length === 0) {
      return { doctors: [], total: 0 };
    }

    const doctors = await prisma.doctorProfile.findMany({
      where: {
        doctorSpecialties: {
          some: {
            specialtyId: { in: specialties.map((s) => s.id) },
          },
        },
        verificationStatus: 'APPROVED',
      },
      include: {
        user: { select: { name: true } },
        currentStatus: true,
        doctorSpecialties: { include: { specialty: true } },
        clinicDoctors: { include: { clinic: true } },
      },
      skip: offset,
      take: limit,
      orderBy: { rating: 'desc' },
    });

    const total = await prisma.doctorProfile.count({
      where: {
        doctorSpecialties: {
          some: {
            specialtyId: { in: specialties.map((s) => s.id) },
          },
        },
      },
    });

    return {
      doctors: doctors.map((d) => ({
        id: d.id,
        name: d.user.name,
        specialties: d.doctorSpecialties.map((ds) => ds.specialty.name),
        rating: d.rating,
        experience: d.experience,
        fee: d.consultationFee,
        status: d.currentStatus?.status || 'OFFLINE',
        clinics: d.clinicDoctors.map((cd) => cd.clinic.name),
      })),
      total,
      page,
      pageSize: limit,
      hasMore: offset + limit < total,
    };
  },
};
