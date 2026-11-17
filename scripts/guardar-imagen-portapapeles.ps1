# Guarda en un archivo la imagen PNG que está en el portapapeles, con su transparencia.
# Se usa con las imágenes generadas en ChatGPT (ver "Imágenes nuevas" en docs/PROCESS.md): la página
# copia el PNG original al portapapeles y este script lo escribe en el proyecto, sin diálogos de guardado.
# Uso: powershell -File scripts/guardar-imagen-portapapeles.ps1 -Ruta descargas/arte/fondo.png
param(
	[Parameter(Mandatory = $true)][string]$Ruta
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Windows.Forms
$datos = [System.Windows.Forms.Clipboard]::GetData("PNG")
if ($null -eq $datos) {
	$formatos = [System.Windows.Forms.Clipboard]::GetDataObject().GetFormats() -join ", "
	Write-Error "No hay un PNG en el portapapeles (formatos: $formatos)"
	exit 1
}
if ([System.IO.Path]::IsPathRooted($Ruta)) {
	$completa = [System.IO.Path]::GetFullPath($Ruta)
} else {
	$completa = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Ruta))
}
New-Item -ItemType Directory -Force (Split-Path $completa) | Out-Null
$archivo = [System.IO.File]::Create($completa)
try {
	$datos.CopyTo($archivo)
} finally {
	$archivo.Close()
}
"$completa ($((Get-Item $completa).Length) bytes)"
