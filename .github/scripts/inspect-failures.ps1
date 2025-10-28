$runs = Invoke-RestMethod -Uri 'https://api.github.com/repos/Dhruv290405/rimmel/actions/runs' -UseBasicParsing
$failures = $runs.workflow_runs | Where-Object { $_.conclusion -eq 'failure' }
foreach ($r in $failures) {
    Write-Output "\n=== Run: $($r.name) (id: $($r.id)) created: $($r.created_at) url: $($r.html_url) ==="
    $jobs = Invoke-RestMethod -Uri "https://api.github.com/repos/Dhruv290405/rimmel/actions/runs/$($r.id)/jobs" -UseBasicParsing
    foreach ($j in $jobs.jobs) {
        Write-Output "Job: $($j.name) (id:$($j.id)) - status:$($j.status) conclusion:$($j.conclusion)"
        if ($j.steps) {
            foreach ($s in $j.steps) {
                if ($s.conclusion -ne 'success') {
                    Write-Output "  Step: $($s.number) $($s.name) -> $($s.conclusion)"
                }
            }
        }
    }
}
