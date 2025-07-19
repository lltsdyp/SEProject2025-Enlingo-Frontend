# WorksheetFetchInfoResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**list** | **Array&lt;string&gt;** | 获取到的单词列表，第一个单词是正确答案 | [default to undefined]
**hasNextPage** | **boolean** | 是否还有更多单词 | [default to undefined]
**nextWord** | **string** | 下一个单词 | [default to undefined]
**translation** | **string** | 正确单词对应的中文翻译 | [default to undefined]

## Example

```typescript
import { WorksheetFetchInfoResponse } from './api';

const instance: WorksheetFetchInfoResponse = {
    list,
    hasNextPage,
    nextWord,
    translation,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
