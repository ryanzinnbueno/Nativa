# Execute no PowerShell. O token e solicitado de forma oculta e nao e salvo.
$ErrorActionPreference = 'Stop'
$projectRef = 'ztgmikmwpkhozrrfmuju'
$secureAccessToken = Read-Host 'Cole seu token pessoal do Supabase (entrada oculta)' -AsSecureString
$tokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureAccessToken)
try {
  $accessToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPointer)
  $authHeaders = @{ Authorization = "Bearer $accessToken" }
  $endpoint = "https://api.supabase.com/v1/projects/$projectRef/config/auth"
  $previousConfig = Invoke-RestMethod -Method Get -Uri $endpoint -Headers $authHeaders
  $payload = @{external_phone_enabled=$true; sms_autoconfirm=$true} | ConvertTo-Json
  $null = Invoke-RestMethod -Method Patch -Uri $endpoint -Headers $authHeaders -ContentType 'application/json' -Body $payload
  $updatedConfig = Invoke-RestMethod -Method Get -Uri $endpoint -Headers $authHeaders
  if ($updatedConfig.external_phone_enabled -ne $true -or $updatedConfig.sms_autoconfirm -ne $true) {
    throw 'O Supabase nao confirmou a ativacao. Nenhuma senha foi alterada.'
  }
  if ($updatedConfig.mailer_autoconfirm -ne $previousConfig.mailer_autoconfirm -or $updatedConfig.external_email_enabled -ne $previousConfig.external_email_enabled) {
    throw 'Confira a configuracao de e-mail no painel antes de publicar.'
  }
  Write-Host 'Login com telefone e senha ativado, sem SMS. A configuracao de e-mail foi preservada.' -ForegroundColor Green
} catch {
  Write-Host 'Nao foi possivel confirmar a ativacao. Confira se o token pertence a conta do projeto e tem permissao de gerenciar autenticacao. Nao envie o token no chat.' -ForegroundColor Red
  exit 1
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPointer)
  $accessToken = $null
  $authHeaders = $null
  $secureAccessToken.Dispose()
}
