# SectionInfoResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | 章节id | [default to undefined]
**title** | **string** | 章节标题 | [default to undefined]
**chapters** | [**Array&lt;ChapterInfoResponse&gt;**](ChapterInfoResponse.md) | 当前章节包含的所有段落id | [default to undefined]

## Example

```typescript
import { SectionInfoResponse } from './api';

const instance: SectionInfoResponse = {
    id,
    title,
    chapters,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
