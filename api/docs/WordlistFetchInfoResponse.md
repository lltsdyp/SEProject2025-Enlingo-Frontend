# WordlistFetchInfoResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**number** | **number** | 本次获取的单词数量 | [optional] [default to undefined]
**list** | **Array&lt;string&gt;** | 获取到的单词列表 | [default to undefined]
**hasNextPage** | **boolean** | 是否还有更多单词 | [default to undefined]
**nextWord** | **string** | 下一个单词 | [default to undefined]

## Example

```typescript
import { WordlistFetchInfoResponse } from './api';

const instance: WordlistFetchInfoResponse = {
    number,
    list,
    hasNextPage,
    nextWord,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
