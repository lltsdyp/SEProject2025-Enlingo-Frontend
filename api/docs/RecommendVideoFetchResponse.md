# RecommendVideoFetchResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**data** | [**Array&lt;RecommendVideoResponse&gt;**](RecommendVideoResponse.md) | 推荐的视频 | [default to undefined]
**hasNextPage** | **boolean** | 通知前端是否还有更多视频 | [default to undefined]
**count** | **number** | 本次查询返回了多少条数据 | [default to undefined]
**nextCursor** | **string** | 返回指向当前最后一个视频的游标 | [optional] [default to undefined]

## Example

```typescript
import { RecommendVideoFetchResponse } from './api';

const instance: RecommendVideoFetchResponse = {
    data,
    hasNextPage,
    count,
    nextCursor,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
