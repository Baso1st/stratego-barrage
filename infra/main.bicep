// The app's infrastructure for one environment. The deploy workflow applies this
// to the environment's resource group on every deployment.

@description('Which environment this is.')
@allowed([
  'test'
  'production'
])
param environmentName string

@description('Region for the Static Web App. Defaults to the resource group\'s region.')
param location string = resourceGroup().location

resource staticWebApp 'Microsoft.Web/staticSites@2024-11-01' = {
  name: 'stratego-barrage-${environmentName}'
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {}
}

output name string = staticWebApp.name
output url string = 'https://${staticWebApp.properties.defaultHostname}'
