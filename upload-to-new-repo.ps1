# 上传项目到新的 GitHub 仓库
# 排除环境变量文件（已在 .gitignore 中配置）

Write-Host "开始上传项目到 GitHub..." -ForegroundColor Green

# 确保在正确的目录
Set-Location -Path "d:\AIsoftware\SoloBoard_Command_center"

# 检查 git 状态
Write-Host "`n检查 Git 状态..." -ForegroundColor Yellow
git status

# 添加所有文件（.gitignore 会自动排除环境变量）
Write-Host "`n添加文件到暂存区..." -ForegroundColor Yellow
git add .

# 提交更改
Write-Host "`n提交更改..." -ForegroundColor Yellow
$commitMessage = Read-Host "请输入提交信息（直接回车使用默认信息）"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Update: SoloBoard Command Center - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}
git commit -m $commitMessage

# 确认远程仓库地址
Write-Host "`n当前远程仓库地址:" -ForegroundColor Yellow
git remote -v

# 推送到远程仓库
Write-Host "`n推送到 GitHub..." -ForegroundColor Yellow
git push -u origin master

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ 上传成功！" -ForegroundColor Green
    Write-Host "项目已上传到: https://github.com/JPierreXiong/SoloBoard_CC_C.git" -ForegroundColor Cyan
} else {
    Write-Host "`n✗ 上传失败，请检查网络连接或 GitHub 权限" -ForegroundColor Red
    Write-Host "如果是首次推送，可能需要先在 GitHub 创建空仓库" -ForegroundColor Yellow
    Write-Host "或者尝试使用 SSH 方式：" -ForegroundColor Yellow
    Write-Host "  git remote set-url origin git@github.com:JPierreXiong/SoloBoard_CC_C.git" -ForegroundColor Cyan
    Write-Host "  git push -u origin master" -ForegroundColor Cyan
}

Write-Host "`n按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")






