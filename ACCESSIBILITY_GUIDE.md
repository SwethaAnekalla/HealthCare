# CareSync Accessibility Guide

## Overview
CareSync is designed and built to WCAG 2.1 Level AA accessibility standards. This guide documents our accessibility features and how to use them.

## Quick Accessibility Features

### Keyboard Navigation
- **Tab**: Move forward through interactive elements
- **Shift + Tab**: Move backward through interactive elements
- **Enter**: Activate buttons or submit forms
- **Space**: Toggle checkboxes or activate buttons
- **Arrow Keys**: Navigate within dropdowns, tabs, and lists
- **Escape**: Close modals, dropdowns, and menus

### Screen Reader Support
- All pages work with NVDA (Windows), JAWS, and VoiceOver (macOS/iOS)
- Form labels associated with inputs
- Button purposes clearly labeled
- Live regions announce status updates
- Tables have proper header associations

### Color & Contrast
- All text meets WCAG AA contrast requirements (4.5:1 minimum)
- Color not the only indicator of status
- Colorblind-friendly color palette

### Responsive Design
- Full functionality at any viewport size (360px - 1440px+)
- Touch targets minimum 44x44 pixels
- No horizontal scrolling
- Text readable at 200% zoom

## Feature-Specific Accessibility

### Doctor Search
- Filter options keyboard accessible
- Doctor cards have clear heading hierarchy
- Status badges explained with text (not just color)
- Rating system uses text description
- Star ratings have aria-labels

### Booking Flow
- All form fields properly labeled
- Error messages linked to fields
- Success confirmations announced
- Payment info fields masked

### Queue Tracker
- Current position announced
- ETA updates announced to screen readers
- Progress bar has aria-valuenow
- Token number accessible and keyboard navigable

### Doctor Dashboard
- Queue console fully keyboard navigable
- Status changes announced
- Queue list has proper table headers
- Patient names and times clearly labeled

### Admin Dashboard
- Tabs keyboard navigable (Arrow keys)
- Refund actions labeled
- Dispute information in accessible table format
- Status badges explained with text

### Support Chat
- Chat messages announced to screen readers
- Message timestamps provided
- Agent assignment announced
- Typing indicators accessible

### Symptom Checker
- Text input with clear labels
- Specialty suggestions announced
- Confidence scores explained
- Emergency guidance prominent and announced

## Using CareSync with Assistive Technologies

### Screen Readers (NVDA, JAWS, VoiceOver)

**Getting Started:**
1. Enable screen reader on your device
2. Launch CareSync in your browser
3. Screen reader will announce page heading and purpose

**Navigation:**
- Use heading navigation (H key in most readers)
- Use form field navigation (F key in most readers)
- Use button navigation (B key in most readers)
- Use link navigation (K key in most readers)

**Common Tasks:**
- Booking appointment: Heading down to search, fill form, submit
- Checking queue status: Go to queue tracker page, status announced
- Managing refunds (admin): Go to admin dashboard, navigate to refunds tab
- Chat with support: Activate chat, messages announced as they arrive

### Keyboard-Only Navigation

**Logging In:**
1. Tab to email field
2. Type email
3. Tab to password field
4. Type password
5. Tab to login button
6. Press Enter

**Booking Appointment:**
1. Tab through search filters
2. Tab to doctor cards
3. Tab through doctor information
4. Tab to book button
5. Press Enter to book
6. Tab through booking form
7. Tab to confirm button
8. Press Enter

**Monitoring Queue:**
1. Navigate to queue tracker
2. Queue position automatically announced
3. Use arrow keys if list is present
4. All updates announced via screen reader

### Zoom & Text Sizing

CareSync works at up to 200% zoom without:
- Loss of functionality
- Horizontal scrolling
- Content overlap
- Text truncation

To zoom:
- **Chrome/Edge**: Ctrl + Plus (Windows) or Cmd + Plus (Mac)
- **Firefox**: Ctrl + Plus (Windows) or Cmd + Plus (Mac)
- **Safari**: Cmd + Plus (Mac only)

### Motion & Animation

If you experience motion sickness from animations:
1. Go to your OS accessibility settings
2. Enable "Reduce Motion" or "Prefers Reduced Motion"
3. Return to CareSync - animations will be minimal

### Dark Mode

Dark mode support:
1. Enable dark mode in your OS
2. CareSync automatically uses your preference
3. All contrast ratios maintained in dark mode

## Accessibility Issues & Reporting

### Found an Accessibility Issue?

Please report it to: **accessibility@caresync.com**

Include:
- Page URL
- What you were trying to do
- What happened
- Your assistive technology (screen reader, keyboard, etc)
- Browser and OS

We typically respond within 24 hours.

### Known Limitations

Currently investigating:
- Complex data visualizations in admin analytics
- Real-time update announcements (being improved)
- PDF export accessibility

## Testing Our Accessibility

### What We Test

**Automated:**
- Axe DevTools (weekly)
- Lighthouse audit (every deployment)
- WebAIM contrast checker

**Manual:**
- NVDA screen reader
- Keyboard-only navigation
- Zoom testing
- Color contrast verification

**User Testing:**
- Monthly testing with assistive tech users
- Feedback implementation
- Quarterly accessibility audit

### Third-Party Testing

CareSync undergoes independent accessibility audits:
- WCAG 2.1 Level AA compliance verified
- Section 508 compliance verified
- Annual accessibility review

## Accessibility Resources

### For Users
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [NVDA User Guide](https://www.nvaccess.org/)
- [macOS VoiceOver Guide](https://www.apple.com/accessibility/voiceover/)
- [Windows Narrator Guide](https://support.microsoft.com/en-us/help/14234/)

### For Developers
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Articles](https://webaim.org/)
- [Accessible Rich Internet Applications](https://www.w3.org/TR/wai-aria-1.2/)

## Accessibility Compliance Statement

CareSync is committed to ensuring digital accessibility for individuals with disabilities. We continually strive to improve the accessibility of our website and application in conformance with the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.

### Standards Compliance
- ✅ WCAG 2.1 Level AA
- ✅ Section 508 (US)
- ✅ EN 301 549 (EU)

### Accessibility Features
- ✅ Keyboard navigation
- ✅ Screen reader support
- ✅ High color contrast
- ✅ Responsive design
- ✅ Focus indicators
- ✅ Semantic HTML
- ✅ ARIA labels
- ✅ Reduced motion support

### Accessibility Team

**Contact:** accessibility@caresync.com

Our accessibility team reviews and tests:
- New features
- Design changes
- Third-party components
- User feedback

## Feedback & Continuous Improvement

We value your feedback. If you have accessibility suggestions:

1. **Quick Feedback**: Use the feedback button in app
2. **Detailed Report**: Email accessibility@caresync.com
3. **Accessibility Audit Request**: Submit form on settings

We'll review all feedback within 48 hours and respond with:
- Acknowledgment
- Timeline for resolution
- Updates on progress

## Latest Updates

### October 2024
- ✅ Added full keyboard navigation
- ✅ Implemented ARIA live regions for real-time updates
- ✅ Added screen reader support for all dashboards
- ✅ Verified WCAG AA compliance
- ✅ Added reduced motion support

### September 2024
- ✅ Improved color contrast ratios
- ✅ Enhanced form accessibility
- ✅ Added skip links
- ✅ Improved focus indicators

## Support

For technical issues or accessibility barriers:
- **Email**: support@caresync.com
- **Phone**: 1-800-CARESYNC (1-800-227-3796)
- **Hours**: Mon-Fri 9am-6pm IST

We also support:
- Video relay service (VRS)
- Text relay service (TTY)
- Custom accommodations

---

**Last Updated**: October 1, 2024  
**Next Review**: January 1, 2025
