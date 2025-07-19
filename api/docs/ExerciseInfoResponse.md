# ExerciseInfoResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**xp** | **number** | 完成一次练习获取的经验值 | [default to undefined]
**difficulty** | **string** | 当前练习的难度(easy/medium/hard） | [default to undefined]
**items** | [**Array&lt;ExerciseInfoResponseItemsInner&gt;**](ExerciseInfoResponseItemsInner.md) | 当前练习包含的所有项目 | [default to undefined]

## Example

```typescript
import { ExerciseInfoResponse } from './api';

const instance: ExerciseInfoResponse = {
    xp,
    difficulty,
    items,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
