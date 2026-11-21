# Maintaining a PR Chain

## Before Delivery

Check the repository's permitted merge methods and automatic branch deletion behavior. Keep a record of each unit's commit range and base so inherited changes can be distinguished from the unit itself.

## After Each Merge

1. Fetch the updated target and inspect the predecessor's merge result.
2. Retarget the next PR only after confirming how its commit ancestry relates to the target.
3. Check its complete diff, commit list, authored code count, and required checks. The diff must show only the next unit; changed bases can reveal conflicts or duplicated inherited changes.
4. Continue merging in dependency order under the original authorized scope.

## Squash or Rebase Merge

These methods can remove the shared ancestry that makes retargeting sufficient. Do not force-push a published child branch to repair the chain.

When repair is necessary, create a replacement branch from the updated target and replay only that child's own commits. Verify the resulting content and diff, then push it as a new branch. GitHub cannot change a PR's head branch: open a replacement PR, link it to the original, and close the superseded PR only after the replacement preserves its scope and discussion references. Rebuild dependent branches in order when necessary.

This is maintenance of the existing delivery scope, not authorization to add work. If branch rules, conflicts, or uncertain commit boundaries prevent a safe repair, report the concrete blocker rather than guessing or discarding user work.
