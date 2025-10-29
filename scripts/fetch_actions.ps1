$owner = 'Dhruv290405'
$repo = 'rimmel'
$base = "https://api.github.com/repos/$owner/$repo/actions/runs"
Write-Output "Fetching workflow runs for $owner/$repo..."
$resp = Invoke-RestMethod -Uri $base -UseBasicParsing
$runs = $resp.workflow_runs
$failed = $runs | Where-Object { $_.conclusion -ne 'success' }
if (-not $failed) { Write-Output 'No failed runs found'; exit 0 }
foreach ($r in $failed) {
    Write-Output '------------------------------------------------------------'
    Write-Output "RunId: $($r.id)"
    Write-Output "Name : $($r.name)"
    Write-Output "Branch: $($r.head_branch)"
    Write-Output "Event: $($r.event)"
    Write-Output "Created: $($r.created_at)"
    Write-Output "Status: $($r.status)  Conclusion: $($r.conclusion)"
    Write-Output "URL: $($r.html_url)"

    $jobsUri = "https://api.github.com/repos/$owner/$repo/actions/runs/$($r.id)/jobs"
    $jobsResp = Invoke-RestMethod -Uri $jobsUri -UseBasicParsing
    foreach ($j in $jobsResp.jobs) {
        Write-Output "  Job: $($j.name) (id=$($j.id)) status=$($j.status) conclusion=$($j.conclusion)"
        if ($j.steps) {
            foreach ($s in $j.steps) {
                Write-Output "    Step #$($s.number): $($s.name) -> status=$($s.status) conclusion=$($s.conclusion)"
            }
        }
        else {
            Write-Output "    (no steps found for job)"
        }
    }
}
