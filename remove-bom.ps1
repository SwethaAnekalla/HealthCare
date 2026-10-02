$path = 'C:\Users\sama\healthcare-platform\apps\api\prisma\schema.prisma'
$content = [System.IO.File]::ReadAllText($path)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
Write-Host 'File written without BOM'
