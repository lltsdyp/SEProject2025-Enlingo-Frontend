# DefaultApi

All URIs are relative to *http://localhost*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**contentChapterGet**](#contentchapterget) | **GET** /content/chapter | 获取段落信息|
|[**contentExerciseGet**](#contentexerciseget) | **GET** /content/exercise | 获取练习信息|
|[**contentLessonGet**](#contentlessonget) | **GET** /content/lesson | 获取课程信息|
|[**contentSectionsGet**](#contentsectionsget) | **GET** /content/sections | 获取章节列表|
|[**recommendGetGet**](#recommendgetget) | **GET** /recommend/get | 获得推荐视频|
|[**videoRawGet**](#videorawget) | **GET** /video/raw | 获取视频url|
|[**videoSubtitleGet**](#videosubtitleget) | **GET** /video/subtitle | 获取字幕文件url|
|[**wordlistAddPost**](#wordlistaddpost) | **POST** /wordlist/add | 创建生词条目|
|[**wordlistDeletePost**](#wordlistdeletepost) | **POST** /wordlist/delete | 删除生词条目|
|[**wordlistGetGet**](#wordlistgetget) | **GET** /wordlist/get | 获取生词表|
|[**wordlistRandomwordGet**](#wordlistrandomwordget) | **GET** /wordlist/randomword | 获取四个随机单词|
|[**wordlistTranslateGet**](#wordlisttranslateget) | **GET** /wordlist/translate | 获取单词翻译|

# **contentChapterGet**
> ChapterInfoResponse contentChapterGet()



### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let id: number; //要获取的段落的id (default to undefined)

const { status, data } = await apiInstance.contentChapterGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | 要获取的段落的id | defaults to undefined|


### Return type

**ChapterInfoResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **contentExerciseGet**
> ExerciseInfoResponse contentExerciseGet()



### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let id: number; //练习的id (default to undefined)

const { status, data } = await apiInstance.contentExerciseGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | 练习的id | defaults to undefined|


### Return type

**ExerciseInfoResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **contentLessonGet**
> LessonInfoResponse contentLessonGet()



### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let id: number; //课程id (default to undefined)

const { status, data } = await apiInstance.contentLessonGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | 课程id | defaults to undefined|


### Return type

**LessonInfoResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **contentSectionsGet**
> SectionListResponse contentSectionsGet()

获取给定语言的所有章节的列表

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let lang: string; //指定语言参数 (default to undefined)

const { status, data } = await apiInstance.contentSectionsGet(
    lang
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **lang** | [**string**] | 指定语言参数 | defaults to undefined|


### Return type

**SectionListResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **recommendGetGet**
> RecommendVideoFetchResponse recommendGetGet()



### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let limit: number; //限制此次请求返回的最大视频数量 (default to undefined)
let id: number; //指定一次fetch的id (optional) (default to undefined)
let before: number; //指向最后一条记录的游标 (optional) (default to undefined)

const { status, data } = await apiInstance.recommendGetGet(
    limit,
    id,
    before
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **limit** | [**number**] | 限制此次请求返回的最大视频数量 | defaults to undefined|
| **id** | [**number**] | 指定一次fetch的id | (optional) defaults to undefined|
| **before** | [**number**] | 指向最后一条记录的游标 | (optional) defaults to undefined|


### Return type

**RecommendVideoFetchResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**500** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **videoRawGet**
> VideoSubtitleGet200Response videoRawGet()

根据提供的视频id，提供视频相对应的url

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let id: number; //对应的视频id (optional) (default to undefined)

const { status, data } = await apiInstance.videoRawGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | 对应的视频id | (optional) defaults to undefined|


### Return type

**VideoSubtitleGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **videoSubtitleGet**
> VideoSubtitleGet200Response videoSubtitleGet()

根据提供的视频id，提供视频相对应的字幕文件url

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let id: number; //对应的视频id (optional) (default to undefined)

const { status, data } = await apiInstance.videoSubtitleGet(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**number**] | 对应的视频id | (optional) defaults to undefined|


### Return type

**VideoSubtitleGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **wordlistAddPost**
> wordlistAddPost()

添加一个单词到用户的生词本中

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let word: string; //需要添加到单词本中的单词 (default to undefined)

const { status, data } = await apiInstance.wordlistAddPost(
    word
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **word** | [**string**] | 需要添加到单词本中的单词 | defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**500** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **wordlistDeletePost**
> wordlistDeletePost()

从用户的生词本中删除一个条目

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let word: string; //要删除的单词名称 (default to undefined)

const { status, data } = await apiInstance.wordlistDeletePost(
    word
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **word** | [**string**] | 要删除的单词名称 | defaults to undefined|


### Return type

void (empty response body)

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **wordlistGetGet**
> WordlistFetchInfoResponse wordlistGetGet()

获取生词列表，具体提供单词的顺序由后端确定

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let limit: number; //限制最大获取的生词数量 (default to undefined)
let before: string; //获取的最后一个生词 (optional) (default to undefined)

const { status, data } = await apiInstance.wordlistGetGet(
    limit,
    before
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **limit** | [**number**] | 限制最大获取的生词数量 | defaults to undefined|
| **before** | [**string**] | 获取的最后一个生词 | (optional) defaults to undefined|


### Return type

**WordlistFetchInfoResponse**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **wordlistRandomwordGet**
> WordlistRandomwordGet200Response wordlistRandomwordGet()

从陌生的单词表中获取任四个不重复的随机单词

### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

const { status, data } = await apiInstance.wordlistRandomwordGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**WordlistRandomwordGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **wordlistTranslateGet**
> WordlistTranslateGet200Response wordlistTranslateGet()



### Example

```typescript
import {
    DefaultApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new DefaultApi(configuration);

let name: string; //名称 (optional) (default to undefined)

const { status, data } = await apiInstance.wordlistTranslateGet(
    name
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **name** | [**string**] | 名称 | (optional) defaults to undefined|


### Return type

**WordlistTranslateGet200Response**

### Authorization

No authorization required

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** |  |  -  |
|**404** |  |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

