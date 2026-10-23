# Proposal

## Why

The model repository keeps some namespaces in more than one folder. Four folders (`mobile_device`, `mobile_connection`,
`mobile_connectivity`, `mobile_performance`) declare, inside their files, the namespaces `device`, `connection`,
`connectivity` and `device_performance`: they add tables to those namespaces. The explorer grouped by folder name, so it
showed 32 namespaces where the model has 28, put `connection.mobile_events` and `device.mobile_devices` under made-up
namespaces, and left five links to `device.mobile_device` unresolved.

## What Changes

- A namespace is identified by the name declared inside its model files; folders that declare the same name are merged into one namespace.
- The overview says which folders a namespace comes from.
- Links that point at a table in a merged namespace resolve.

## Capabilities

### New Capabilities

### Modified Capabilities
- `model-source`: folders that declare the same namespace are one namespace.
- `model-api`: namespaces are listed once, with the folders they come from.
- `store-overview`: the overview names the source folders.

## Impact

- 32 namespaces become 28; the four mobile tables move into `device`, `connection`, `connectivity` and `device_performance`, so their addresses change (for example `/device/mobile_device`).
- Five links that showed as plain text (alert, alert impact and three mobile events pointing at the mobile device) become links.
- The search results, navigation and diagrams follow.
