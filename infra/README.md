# Infrastructure

The Azure infrastructure, as code, in [Bicep](https://learn.microsoft.com/azure/azure-resource-manager/bicep/).

| Path | What it is | Applied by |
| --- | --- | --- |
| `main.bicep` | The Static Web App for one environment | The deploy workflow, on every deployment |
| `bootstrap/` | The resource groups, and the identities GitHub Actions deploys as | You, by hand, once |

Changes to `main.bicep` follow the same path as app changes: they reach test when merged to `main`, and production when released.

## What exists

| Resource group | Contains |
| --- | --- |
| `rg-stratego-barrage-test` | Static Web App `stratego-barrage-test` |
| `rg-stratego-barrage-production` | Static Web App `stratego-barrage-production` |
| `rg-stratego-barrage-identities` | Managed identities `id-stratego-barrage-test` and `id-stratego-barrage-production` |

Each identity trusts GitHub's OIDC tokens for jobs that run in one GitHub environment of this repo, and is Contributor on that environment's resource group only. No Azure passwords or deployment tokens are stored in GitHub.

## Bootstrap

Run this once, and again only after changing files under `bootstrap/` (it's safe to rerun). It needs Owner on the subscription, because it creates role assignments.

```sh
az login
az account set --subscription "<subscription name or ID>"
az deployment sub create --name stratego-barrage-bootstrap --location centralus --template-file infra/bootstrap/main.bicep
```

Then put its outputs into GitHub (**Settings → Secrets and variables → Actions**, and **Settings → Environments**):

| Secret | Where | Value |
| --- | --- | --- |
| `AZURE_TENANT_ID` | Repository | `tenantId` |
| `AZURE_SUBSCRIPTION_ID` | Repository | `subscriptionId` |
| `AZURE_CLIENT_ID` | `test` environment | `clientIds` → test |
| `AZURE_CLIENT_ID` | `production` environment | `clientIds` → production |

To see the outputs again: `az deployment sub show --name stratego-barrage-bootstrap --query properties.outputs`.

## Gotchas

- **Renaming or transferring the repo** changes the OIDC subject GitHub issues, and sign-in will fail. Update `githubSubjectPrefix` in `bootstrap/main.bicep` from `GET /repos/{owner}/{repo}/actions/oidc/customization/sub` and rerun the bootstrap.
- **The `Microsoft.Web` resource provider** must be registered on the subscription, because the deploy identities can't register it themselves: `az provider register --namespace Microsoft.Web`.
