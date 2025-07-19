# ChapterInfoResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **number** | 段落的id | [default to undefined]
**title** | **string** | 段落的标题 | [default to undefined]
**description** | **string** | 段落的描述 | [default to undefined]
**lessons** | [**Array&lt;LessonInfoResponse&gt;**](LessonInfoResponse.md) | 段落包含的所有课程信息 | [default to undefined]

## Example

```typescript
import { ChapterInfoResponse } from './api';

const instance: ChapterInfoResponse = {
    id,
    title,
    description,
    lessons,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
