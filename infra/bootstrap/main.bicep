// One-time setup, run by hand (see infra/README.md). For each environment it creates
// a resource group, plus an identity that GitHub Actions signs in as to deploy into it.
targetScope = 'subscription'

@description('Region for the resource groups. Must be one that Static Web Apps supports.')
@allowed([
  'centralus'
  'eastus2'
  'westus2'
  'westeurope'
  'eastasia'
])
param location string = 'centralus'

@description('Start of the OIDC subject GitHub issues for this repo: sub_claim_prefix from GET /repos/{owner}/{repo}/actions/oidc/customization/sub.')
param githubSubjectPrefix string = 'repo:Baso1st@29257536/stratego-barrage@1421196828'

var environments = [
  'test'
  'production'
]

// Kept apart from the environment groups so a deploy identity can't edit itself.
resource identitiesGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: 'rg-stratego-barrage-identities'
  location: location
}

resource environmentGroups 'Microsoft.Resources/resourceGroups@2024-03-01' = [
  for env in environments: {
    name: 'rg-stratego-barrage-${env}'
    location: location
  }
]

module identities 'identity.bicep' = [
  for env in environments: {
    name: 'identity-${env}'
    scope: identitiesGroup
    params: {
      environmentName: env
      location: location
      githubSubject: '${githubSubjectPrefix}:environment:${env}'
    }
  }
]

module contributorAssignments 'contributor.bicep' = [
  for (env, i) in environments: {
    name: 'contributor-${env}'
    scope: environmentGroups[i]
    params: {
      principalId: identities[i].outputs.principalId
    }
  }
]

output tenantId string = tenant().tenantId
output subscriptionId string = subscription().subscriptionId
output clientIds array = [
  for (env, i) in environments: {
    environment: env
    clientId: identities[i].outputs.clientId
  }
]
