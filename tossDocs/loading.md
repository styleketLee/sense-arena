---
url: 'https://developers-apps-in-toss.toss.im/unity/optimization/start/loading.md'
---
# 로딩 최적화

앱인토스 Unity 게임에서 효율적인 로딩 시스템을 구현하여 사용자 경험을 향상시키고 메모리 사용량을 최적화하는 방법을 제공해요.

## 1. 로딩 시스템 개요

### 앱인토스 로딩 전략

```
🔄 앱인토스 로딩 시스템 구조
├── 초기 로딩 (Critical Loading)
│   ├── 게임 엔진 초기화
│   ├── 앱인토스 SDK 초기화
│   ├── 토스 인증 시스템
│   └── 첫 씬 필수 에셋
├── 백그라운드 로딩 (Background Loading)
│   ├── 다음 레벨 에셋
│   ├── 사운드 및 음악
│   └── 선택적 기능 에셋
└── 온디맨드 로딩 (On-Demand Loading)
    ├── 사용자 요청 시 로딩
    └── IAP 관련 에셋
```

### 로딩 성능 목표

* 초기 로딩: 5초 이내
* 씬 전환: 2초 이내
* 백그라운드 로딩: 게임플레이에 영향 없음
* 메모리 효율성: 언로드 에셋 관리

***

## 2. 통합 로딩 매니저

### 핵심 로딩 시스템

```c#
using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class AppsInTossLoadingManager : MonoBehaviour
{
    public static AppsInTossLoadingManager Instance { get; private set; }
    
    [System.Serializable]
    public class LoadingGroup
    {
        public string groupName;
        public LoadingPriority priority;
        public List<string> addressableKeys = new List<string>();
        public List<UnityEngine.Object> resourceAssets = new List<UnityEngine.Object>();
        public bool unloadOnSceneChange = true;
        public float maxLoadTime = 10f;
    }
    
    public enum LoadingPriority
    {
        Critical,    // 즉시 로딩 (게임 시작 전 완료 필요)
        High,        // 우선 로딩 (첫 씬에서 필요)
        Medium,      // 백그라운드 로딩 (게임 중 로딩)
        Low          // 지연 로딩 (필요시 로딩)
    }
    
    [Header("로딩 그룹 설정")]
    public LoadingGroup[] loadingGroups;
    
    [Header("앱인토스 연동")]
    public bool enableTossIntegration = true;
    public bool showLoadingProgress = true;
    public GameObject loadingScreenPrefab;
    
    // 로딩 상태 추적
    private Dictionary<string, bool> groupLoadingStatus = new Dictionary<string, bool>();
    private Dictionary<string, List<object>> loadedAssets = new Dictionary<string, List<object>>();
    private AppsInTossLoadingScreen currentLoadingScreen;
    
    // 이벤트
    public System.Action<string, float> OnGroupProgressUpdated;
    public System.Action<string> OnGroupLoadingComplete;
    public System.Action OnAllCriticalLoadingComplete;
    
    void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            DontDestroyOnLoad(gameObject);
            InitializeLoadingSystem();
        }
        else
        {
            Destroy(gameObject);
        }
    }
    
    void InitializeLoadingSystem()
    {
        Debug.Log("앱인토스 로딩 시스템 초기화");
        
        // 로딩 상태 초기화
        foreach (var group in loadingGroups)
        {
            groupLoadingStatus[group.groupName] = false;
            loadedAssets[group.groupName] = new List<object>();
        }
        
        // 로딩 화면 생성
        if (showLoadingProgress && loadingScreenPrefab != null)
        {
            var screenGO = Instantiate(loadingScreenPrefab);
            currentLoadingScreen = screenGO.GetComponent<AppsInTossLoadingScreen>();
        }
        
        // 자동 로딩 시작
        StartCoroutine(AutoLoadingSequence());
    }
    
    IEnumerator AutoLoadingSequence()
    {
        // 1. Critical 우선순위 그룹 로딩
        yield return StartCoroutine(LoadGroupsByPriority(LoadingPriority.Critical));
        OnAllCriticalLoadingComplete?.Invoke();
        
        // 2. High 우선순위 그룹 로딩
        yield return StartCoroutine(LoadGroupsByPriority(LoadingPriority.High));
        
        // 3. Medium, Low 우선순위는 백그라운드에서 로딩
        StartCoroutine(LoadGroupsByPriority(LoadingPriority.Medium));
        StartCoroutine(LoadGroupsByPriority(LoadingPriority.Low));
        
        // 로딩 화면 숨기기
        if (currentLoadingScreen != null)
        {
            currentLoadingScreen.HideLoadingScreen();
        }
    }
    
    IEnumerator LoadGroupsByPriority(LoadingPriority priority)
    {
        var targetGroups = System.Array.FindAll(loadingGroups, g => g.priority == priority);
        
        foreach (var group in targetGroups)
        {
            yield return StartCoroutine(LoadGroup(group));
        }
    }
    
    public IEnumerator LoadGroup(string groupName)
    {
        var group = System.Array.Find(loadingGroups, g => g.groupName == groupName);
        if (group != null)
        {
            yield return StartCoroutine(LoadGroup(group));
        }
    }
    
    IEnumerator LoadGroup(LoadingGroup group)
    {
        if (groupLoadingStatus.ContainsKey(group.groupName) && groupLoadingStatus[group.groupName])
        {
            yield break; // 이미 로딩된 그룹
        }
        
        Debug.Log($"로딩 그룹 시작: {group.groupName} (우선순위: {group.priority})");
        
        float startTime = Time.realtimeSinceStartup;
        int totalAssets = group.addressableKeys.Count + group.resourceAssets.Count;
        int loadedCount = 0;
        
        // Addressable 에셋 로딩
        foreach (var key in group.addressableKeys)
        {
            yield return StartCoroutine(LoadAddressableAsset(key, group.groupName));
            loadedCount++;
            
            // 진행률 업데이트
            float progress = (float)loadedCount / totalAssets;
            OnGroupProgressUpdated?.Invoke(group.groupName, progress);
            UpdateLoadingUI(group.groupName, progress);
            
            // 타임아웃 체크
            if (Time.realtimeSinceStartup - startTime > group.maxLoadTime)
            {
                Debug.LogWarning($"로딩 그룹 타임아웃: {group.groupName}");
                break;
            }
        }
        
        // Resources 에셋 로딩
        foreach (var asset in group.resourceAssets)
        {
            if (asset != null)
            {
                loadedAssets[group.groupName].Add(asset);
                loadedCount++;
                
                float progress = (float)loadedCount / totalAssets;
                OnGroupProgressUpdated?.Invoke(group.groupName, progress);
                UpdateLoadingUI(group.groupName, progress);
            }
            
            yield return null; // 프레임 분산
        }
        
        // 그룹 로딩 완료 처리
        groupLoadingStatus[group.groupName] = true;
        float loadTime = Time.realtimeSinceStartup - startTime;
        
        Debug.Log($"로딩 그룹 완료: {group.groupName} ({loadTime:F2}초, {loadedCount}/{totalAssets} 에셋)");
        OnGroupLoadingComplete?.Invoke(group.groupName);
        
        // 앱인토스 분석에 로딩 데이터 전송
        ReportLoadingMetrics(group.groupName, loadTime, loadedCount, totalAssets);
    }
    
    IEnumerator LoadAddressableAsset(string key, string groupName)
    {
        var handle = Addressables.LoadAssetAsync<UnityEngine.Object>(key);
        
        yield return handle;
        
        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            loadedAssets[groupName].Add(handle.Result);
            Debug.Log($"Addressable 에셋 로딩 성공: {key}");
        }
        else
        {
            Debug.LogError($"Addressable 에셋 로딩 실패: {key} - {handle.OperationException}");
        }
    }
    
    void UpdateLoadingUI(string groupName, float progress)
    {
        if (currentLoadingScreen != null)
        {
            currentLoadingScreen.UpdateGroupProgress(groupName, progress);
        }
        
        // 앱인토스 네이티브 로딩 UI 업데이트
        if (enableTossIntegration)
        {
            AppsInToss.UpdateLoadingProgress(progress, $"{groupName} 로딩 중...");
        }
    }
    
    void ReportLoadingMetrics(string groupName, float loadTime, int loadedCount, int totalAssets)
    {
        var metrics = new Dictionary<string, object>
        {
            {"group_name", groupName},
            {"load_time", loadTime},
            {"loaded_assets", loadedCount},
            {"total_assets", totalAssets},
            {"success_rate", (float)loadedCount / totalAssets},
            {"timestamp", System.DateTime.UtcNow.ToString("o")}
        };
        
        AppsInToss.SendAnalytics("loading_performance", metrics);
    }
    
    // 공개 API
    public bool IsGroupLoaded(string groupName)
    {
        return groupLoadingStatus.ContainsKey(groupName) && groupLoadingStatus[groupName];
    }
    
    public void UnloadGroup(string groupName)
    {
        if (!loadedAssets.ContainsKey(groupName)) return;
        
        Debug.Log($"로딩 그룹 언로드: {groupName}");
        
        foreach (var asset in loadedAssets[groupName])
        {
            if (asset is AsyncOperationHandle)
            {
                Addressables.Release((AsyncOperationHandle)asset);
            }
        }
        
        loadedAssets[groupName].Clear();
        groupLoadingStatus[groupName] = false;
    }
    
    public void ForceLoadGroup(string groupName, System.Action<bool> onComplete = null)
    {
        StartCoroutine(ForceLoadGroupCoroutine(groupName, onComplete));
    }
    
    IEnumerator ForceLoadGroupCoroutine(string groupName, System.Action<bool> onComplete)
    {
        yield return StartCoroutine(LoadGroup(groupName));
        onComplete?.Invoke(IsGroupLoaded(groupName));
    }
}
```

***

## 3. 스마트 에셋 로더

### 동적 에셋 관리

```c#
public class SmartAssetLoader : MonoBehaviour
{
    [System.Serializable]
    public class AssetCategory
    {
        public string categoryName;
        public AssetType assetType;
        public List<string> assetAddresses;
        public int maxCacheSize = 10;
        public float cacheTimeout = 300f; // 5분
    }
    
    public enum AssetType
    {
        Texture,
        AudioClip,
        GameObject,
        Material,
        Animation,
        Font
    }
    
    [Header("에셋 카테고리")]
    public AssetCategory[] assetCategories;
    
    [Header("앱인토스 최적화 설정")]
    public bool enableMemoryOptimization = true;
    public long maxMemoryUsageMB = 150; // 앱인토스 권장 제한
    
    // 캐시 관리
    private Dictionary<string, CachedAsset> assetCache = new Dictionary<string, CachedAsset>();
    private Queue<string> recentlyUsedAssets = new Queue<string>();
    
    [System.Serializable]
    private class CachedAsset
    {
        public object asset;
        public float lastAccessTime;
        public int accessCount;
        public long memorySize;
        public AsyncOperationHandle handle;
    }
    
    void Start()
    {
        // 메모리 모니터링 시작
        if (enableMemoryOptimization)
        {
            InvokeRepeating(nameof(OptimizeMemoryUsage), 30f, 30f);
        }
    }
    
    // 에셋 로딩 API
    public void LoadAssetAsync<T>(string address, System.Action<T> onComplete, System.Action<string> onError = null) where T : UnityEngine.Object
    {
        StartCoroutine(LoadAssetCoroutine<T>(address, onComplete, onError));
    }
    
    IEnumerator LoadAssetCoroutine<T>(string address, System.Action<T> onComplete, System.Action<string> onError) where T : UnityEngine.Object
    {
        // 캐시 확인
        if (assetCache.ContainsKey(address))
        {
            var cached = assetCache[address];
            cached.lastAccessTime = Time.realtimeSinceStartup;
            cached.accessCount++;
            
            onComplete?.Invoke(cached.asset as T);
            yield break;
        }
        
        // 새로운 에셋 로딩
        var handle = Addressables.LoadAssetAsync<T>(address);
        yield return handle;
        
        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            // 캐시에 추가
            var cachedAsset = new CachedAsset
            {
                asset = handle.Result,
                lastAccessTime = Time.realtimeSinceStartup,
                accessCount = 1,
                memorySize = EstimateAssetMemorySize(handle.Result),
                handle = handle
            };
            
            assetCache[address] = cachedAsset;
            recentlyUsedAssets.Enqueue(address);
            
            // 메모리 체크
            CheckMemoryUsage();
            
            onComplete?.Invoke(handle.Result);
            
            Debug.Log($"에셋 로딩 완료: {address}");
        }
        else
        {
            string error = $"에셋 로딩 실패: {address} - {handle.OperationException}";
            Debug.LogError(error);
            onError?.Invoke(error);
        }
    }
    
    // 배치 로딩
    public void LoadAssetsAsync<T>(List<string> addresses, System.Action<List<T>> onComplete, System.Action<float> onProgress = null) where T : UnityEngine.Object
    {
        StartCoroutine(LoadAssetsBatchCoroutine<T>(addresses, onComplete, onProgress));
    }
    
    IEnumerator LoadAssetsBatchCoroutine<T>(List<string> addresses, System.Action<List<T>> onComplete, System.Action<float> onProgress) where T : UnityEngine.Object
    {
        var results = new List<T>();
        int loadedCount = 0;
        
        foreach (var address in addresses)
        {
            bool loadCompleted = false;
            T loadedAsset = null;
            
            LoadAssetAsync<T>(address, 
                (asset) => {
                    loadedAsset = asset;
                    loadCompleted = true;
                },
                (error) => {
                    loadCompleted = true;
                }
            );
            
            // 로딩 완료 대기
            yield return new WaitUntil(() => loadCompleted);
            
            if (loadedAsset != null)
            {
                results.Add(loadedAsset);
            }
            
            loadedCount++;
            float progress = (float)loadedCount / addresses.Count;
            onProgress?.Invoke(progress);
        }
        
        onComplete?.Invoke(results);
    }
    
    long EstimateAssetMemorySize(UnityEngine.Object asset)
    {
        // 에셋 타입별 메모리 크기 추정
        if (asset is Texture2D texture)
        {
            return texture.width * texture.height * 4; // RGBA32 기준
        }
        else if (asset is AudioClip audio)
        {
            return audio.samples * audio.channels * 2; // 16-bit PCM 기준
        }
        else if (asset is Mesh mesh)
        {
            return mesh.vertexCount * 32; // 추정값
        }
        else
        {
            return 1024 * 1024; // 1MB 기본값
        }
    }
    
    void CheckMemoryUsage()
    {
        if (!enableMemoryOptimization) return;
        
        long totalMemory = 0;
        foreach (var cached in assetCache.Values)
        {
            totalMemory += cached.memorySize;
        }
        
        long currentMemoryMB = totalMemory / (1024 * 1024);
        
        if (currentMemoryMB > maxMemoryUsageMB)
        {
            Debug.LogWarning($"에셋 캐시 메모리 사용량 초과: {currentMemoryMB}MB > {maxMemoryUsageMB}MB");
            OptimizeMemoryUsage();
        }
    }
    
    void OptimizeMemoryUsage()
    {
        var sortedAssets = new List<KeyValuePair<string, CachedAsset>>();
        
        foreach (var kvp in assetCache)
        {
            sortedAssets.Add(kvp);
        }
        
        // 접근 빈도와 최근 사용 시간을 고려하여 정렬
        sortedAssets.Sort((a, b) => {
            float scoreA = a.Value.accessCount / (Time.realtimeSinceStartup - a.Value.lastAccessTime + 1);
            float scoreB = b.Value.accessCount / (Time.realtimeSinceStartup - b.Value.lastAccessTime + 1);
            return scoreA.CompareTo(scoreB);
        });
        
        // 하위 30% 에셋 언로드
        int assetsToUnload = Mathf.CeilToInt(sortedAssets.Count * 0.3f);
        
        for (int i = 0; i < assetsToUnload && i < sortedAssets.Count; i++)
        {
            string address = sortedAssets[i].Key;
            UnloadAsset(address);
        }
        
        Debug.Log($"메모리 최적화 완료: {assetsToUnload}개 에셋 언로드");
    }
    
    public void UnloadAsset(string address)
    {
        if (assetCache.ContainsKey(address))
        {
            var cached = assetCache[address];
            if (cached.handle.IsValid())
            {
                Addressables.Release(cached.handle);
            }
            
            assetCache.Remove(address);
            Debug.Log($"에셋 언로드: {address}");
        }
    }
    
    public void PreloadCategory(string categoryName, System.Action<bool> onComplete = null)
    {
        var category = System.Array.Find(assetCategories, c => c.categoryName == categoryName);
        if (category != null)
        {
            StartCoroutine(PreloadCategoryCoroutine(category, onComplete));
        }
    }
    
    IEnumerator PreloadCategoryCoroutine(AssetCategory category, System.Action<bool> onComplete)
    {
        Debug.Log($"카테고리 사전 로딩 시작: {category.categoryName}");
        
        int loadedCount = 0;
        int totalAssets = category.assetAddresses.Count;
        
        foreach (var address in category.assetAddresses)
        {
            bool loadCompleted = false;
            
            LoadAssetAsync<UnityEngine.Object>(address,
                (asset) => {
                    loadedCount++;
                    loadCompleted = true;
                },
                (error) => {
                    loadCompleted = true;
                }
            );
            
            yield return new WaitUntil(() => loadCompleted);
        }
        
        bool success = loadedCount == totalAssets;
        Debug.Log($"카테고리 사전 로딩 완료: {category.categoryName} ({loadedCount}/{totalAssets})");
        
        onComplete?.Invoke(success);
    }
    
    // 통계 및 디버깅
    public void LogCacheStatistics()
    {
        Debug.Log($"=== 에셋 캐시 통계 ===");
        Debug.Log($"캐시된 에셋 수: {assetCache.Count}");
        
        long totalMemory = 0;
        foreach (var cached in assetCache.Values)
        {
            totalMemory += cached.memorySize;
        }
        
        Debug.Log($"총 캐시 메모리: {totalMemory / (1024 * 1024)}MB");
        Debug.Log($"메모리 제한: {maxMemoryUsageMB}MB");
    }
    
    void OnApplicationPause(bool pauseStatus)
    {
        if (pauseStatus)
        {
            // 앱이 백그라운드로 갈 때 메모리 최적화
            OptimizeMemoryUsage();
        }
    }
}
```

***

## 4. 씬별 로딩 관리

### 씬 전환 로딩 시스템

```c#
public class SceneLoadingManager : MonoBehaviour
{
    [System.Serializable]
    public class SceneLoadingConfig
    {
        public string sceneName;
        public List<string> requiredAssetGroups = new List<string>();
        public List<string> preloadAssetGroups = new List<string>();
        public bool showLoadingScreen = true;
        public float minLoadingTime = 1f; // 최소 로딩 시간 (UX)
    }
    
    [Header("씬별 로딩 설정")]
    public SceneLoadingConfig[] sceneConfigs;
    
    [Header("앱인토스 연동")]
    public GameObject sceneTransitionPrefab;
    public bool enableTossSceneAnalytics = true;
    
    private string currentScene;
    private float sceneLoadStartTime;
    
    void Start()
    {
        currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name;
    }
    
    public void LoadSceneAsync(string sceneName, System.Action onComplete = null)
    {
        StartCoroutine(LoadSceneCoroutine(sceneName, onComplete));
    }
    
    IEnumerator LoadSceneCoroutine(string sceneName, System.Action onComplete)
    {
        sceneLoadStartTime = Time.realtimeSinceStartup;
        
        var config = System.Array.Find(sceneConfigs, c => c.sceneName == sceneName);
        if (config == null)
        {
            Debug.LogError($"씬 로딩 설정을 찾을 수 없습니다: {sceneName}");
            yield break;
        }
        
        // 로딩 화면 표시
        AppsInTossLoadingScreen loadingScreen = null;
        if (config.showLoadingScreen && sceneTransitionPrefab != null)
        {
            var screenGO = Instantiate(sceneTransitionPrefab);
            loadingScreen = screenGO.GetComponent<AppsInTossLoadingScreen>();
            loadingScreen.ShowSceneTransition(sceneName);
        }
        
        // 1. 필수 에셋 그룹 로딩
        foreach (var groupName in config.requiredAssetGroups)
        {
            if (!AppsInTossLoadingManager.Instance.IsGroupLoaded(groupName))
            {
                yield return AppsInTossLoadingManager.Instance.LoadGroup(groupName);
            }
        }
        
        // 2. 이전 씬 정리
        yield return StartCoroutine(CleanupCurrentScene());
        
        // 3. 새로운 씬 로딩
        var sceneLoadOp = UnityEngine.SceneManagement.SceneManager.LoadSceneAsync(sceneName);
        sceneLoadOp.allowSceneActivation = false;
        
        // 씬 로딩 진행률 모니터링
        while (sceneLoadOp.progress < 0.9f)
        {
            if (loadingScreen != null)
            {
                loadingScreen.UpdateProgress(sceneLoadOp.progress);
            }
            yield return null;
        }
        
        // 4. 사전 로딩 그룹 (백그라운드)
        foreach (var groupName in config.preloadAssetGroups)
        {
            AppsInTossLoadingManager.Instance.ForceLoadGroup(groupName);
        }
        
        // 최소 로딩 시간 대기 (UX 개선)
        float currentLoadTime = Time.realtimeSinceStartup - sceneLoadStartTime;
        if (currentLoadTime < config.minLoadingTime)
        {
            yield return new WaitForSeconds(config.minLoadingTime - currentLoadTime);
        }
        
        // 씬 활성화
        sceneLoadOp.allowSceneActivation = true;
        yield return sceneLoadOp;
        
        // 로딩 화면 숨기기
        if (loadingScreen != null)
        {
            loadingScreen.HideLoadingScreen();
        }
        
        // 씬 전환 완료 처리
        OnSceneLoadComplete(sceneName);
        onComplete?.Invoke();
    }
    
    IEnumerator CleanupCurrentScene()
    {
        Debug.Log($"이전 씬 정리 시작: {currentScene}");
        
        // 현재 씬의 언로드 대상 에셋 그룹 찾기
        var currentConfig = System.Array.Find(sceneConfigs, c => c.sceneName == currentScene);
        if (currentConfig != null)
        {
            // 씬별 전용 에셋 언로드
            foreach (var groupName in currentConfig.requiredAssetGroups)
            {
                var group = System.Array.Find(AppsInTossLoadingManager.Instance.loadingGroups, 
                    g => g.groupName == groupName);
                
                if (group != null && group.unloadOnSceneChange)
                {
                    AppsInTossLoadingManager.Instance.UnloadGroup(groupName);
                }
            }
        }
        
        // 메모리 정리
        System.GC.Collect();
        yield return Resources.UnloadUnusedAssets();
        
        Debug.Log("이전 씬 정리 완료");
    }
    
    void OnSceneLoadComplete(string sceneName)
    {
        float totalLoadTime = Time.realtimeSinceStartup - sceneLoadStartTime;
        
        Debug.Log($"씬 로딩 완료: {currentScene} → {sceneName} ({totalLoadTime:F2}초)");
        currentScene = sceneName;
        
        // 앱인토스 분석에 씬 전환 데이터 전송
        if (enableTossSceneAnalytics)
        {
            var sceneMetrics = new Dictionary<string, object>
            {
                {"from_scene", currentScene},
                {"to_scene", sceneName},
                {"load_time", totalLoadTime},
                {"timestamp", System.DateTime.UtcNow.ToString("o")}
            };
            
            AppsInToss.SendAnalytics("scene_transition", sceneMetrics);
        }
        
        // 성능 목표 체크 (2초 이내)
        if (totalLoadTime > 2f)
        {
            Debug.LogWarning($"씬 전환 시간이 목표를 초과: {totalLoadTime:F2}s > 2s");
            AppsInToss.ReportPerformanceIssue("scene_load_slow", totalLoadTime);
        }
    }
    
    // 빠른 씬 전환 (미리 로딩된 씬)
    public void QuickLoadScene(string sceneName)
    {
        var config = System.Array.Find(sceneConfigs, c => c.sceneName == sceneName);
        if (config == null) return;
        
        // 모든 필수 에셋이 로딩되었는지 확인
        bool allAssetsReady = true;
        foreach (var groupName in config.requiredAssetGroups)
        {
            if (!AppsInTossLoadingManager.Instance.IsGroupLoaded(groupName))
            {
                allAssetsReady = false;
                break;
            }
        }
        
        if (allAssetsReady)
        {
            // 즉시 씬 전환
            UnityEngine.SceneManagement.SceneManager.LoadScene(sceneName);
            OnSceneLoadComplete(sceneName);
        }
        else
        {
            // 일반 로딩 방식으로 폴백
            LoadSceneAsync(sceneName);
        }
    }
}
```

***

## 5. 프리로딩 시스템

### 인텔리전트 프리로딩

```c#
public class IntelligentPreloader : MonoBehaviour
{
    [System.Serializable]
    public class PreloadingRule
    {
        public string ruleName;
        public PreloadTrigger trigger;
        public List<string> targetAssetGroups;
        public float probability = 1.0f; // 프리로딩 확률 (0-1)
        public int maxConcurrentLoads = 2;
    }
    
    public enum PreloadTrigger
    {
        OnSceneStart,
        OnUserIdle,
        OnMenuOpen,
        OnGamePause,
        OnLowActivity,
        OnTossPayReady // 앱인토스 특화
    }
    
    [Header("프리로딩 규칙")]
    public PreloadingRule[] preloadingRules;
    
    [Header("사용자 행동 분석")]
    public bool enableUserBehaviorAnalysis = true;
    public float idleThreshold = 5f; // 유휴 상태 판정 시간
    
    private float lastUserActivity;
    private Dictionary<string, float> assetUsageFrequency = new Dictionary<string, float>();
    private Queue<string> recentScenes = new Queue<string>();
    
    void Start()
    {
        lastUserActivity = Time.realtimeSinceStartup;
        
        if (enableUserBehaviorAnalysis)
        {
            StartCoroutine(AnalyzeUserBehavior());
        }
        
        // 씬 시작 시 프리로딩 규칙 적용
        ExecutePreloadingRules(PreloadTrigger.OnSceneStart);
    }
    
    void Update()
    {
        // 사용자 활동 감지
        if (Input.anyKeyDown || Input.touchCount > 0)
        {
            lastUserActivity = Time.realtimeSinceStartup;
        }
    }
    
    IEnumerator AnalyzeUserBehavior()
    {
        while (true)
        {
            yield return new WaitForSeconds(1f);
            
            // 유휴 상태 감지
            float idleTime = Time.realtimeSinceStartup - lastUserActivity;
            if (idleTime > idleThreshold)
            {
                ExecutePreloadingRules(PreloadTrigger.OnUserIdle);
                yield return new WaitForSeconds(10f); // 중복 실행 방지
            }
        }
    }
    
    public void ExecutePreloadingRules(PreloadTrigger trigger)
    {
        var applicableRules = System.Array.FindAll(preloadingRules, r => r.trigger == trigger);
        
        foreach (var rule in applicableRules)
        {
            // 확률 기반 실행
            if (UnityEngine.Random.Range(0f, 1f) <= rule.probability)
            {
                StartCoroutine(ExecutePreloadingRule(rule));
            }
        }
    }
    
    IEnumerator ExecutePreloadingRule(PreloadingRule rule)
    {
        Debug.Log($"프리로딩 규칙 실행: {rule.ruleName}");
        
        var loadingTasks = new List<Coroutine>();
        
        foreach (var groupName in rule.targetAssetGroups)
        {
            // 동시 로딩 수 제한
            while (loadingTasks.Count >= rule.maxConcurrentLoads)
            {
                yield return null;
                
                // 완료된 작업 제거
                loadingTasks.RemoveAll(task => task == null);
            }
            
            // 이미 로딩된 그룹은 스킵
            if (AppsInTossLoadingManager.Instance.IsGroupLoaded(groupName))
            {
                continue;
            }
            
            // 사용 빈도 기반 우선순위 적용
            float frequency = assetUsageFrequency.ContainsKey(groupName) ? 
                assetUsageFrequency[groupName] : 0f;
            
            if (frequency > 0.3f || rule.trigger == PreloadTrigger.OnSceneStart) // 30% 이상 사용률 or 씬 시작
            {
                var loadTask = StartCoroutine(PreloadAssetGroup(groupName));
                loadingTasks.Add(loadTask);
            }
        }
        
        // 모든 프리로딩 작업 완료 대기
        foreach (var task in loadingTasks)
        {
            if (task != null)
            {
                yield return task;
            }
        }
        
        Debug.Log($"프리로딩 규칙 완료: {rule.ruleName}");
    }
    
    IEnumerator PreloadAssetGroup(string groupName)
    {
        yield return AppsInTossLoadingManager.Instance.LoadGroup(groupName);
        
        // 사용 빈도 업데이트
        if (assetUsageFrequency.ContainsKey(groupName))
        {
            assetUsageFrequency[groupName] += 0.1f;
        }
        else
        {
            assetUsageFrequency[groupName] = 0.1f;
        }
    }
    
    // 앱인토스 특화 프리로딩
    public void PreloadTossPayAssets()
    {
        ExecutePreloadingRules(PreloadTrigger.OnTossPayReady);
        
        // 토스페이 관련 에셋 사전 로딩
        var tossPayAssets = new List<string> { "TossPayUI", "PaymentIcons", "ReceiptTemplates" };
        
        foreach (var assetGroup in tossPayAssets)
        {
            if (AppsInTossLoadingManager.Instance.IsGroupLoaded(assetGroup))
            {
                continue;
            }
            
            AppsInTossLoadingManager.Instance.ForceLoadGroup(assetGroup, (success) => {
                if (success)
                {
                    Debug.Log($"토스페이 에셋 프리로딩 완료: {assetGroup}");
                }
            });
        }
    }
    
    // 씬 전환 패턴 학습
    public void OnSceneChanged(string newScene)
    {
        recentScenes.Enqueue(newScene);
        if (recentScenes.Count > 5)
        {
            recentScenes.Dequeue();
        }
        
        // 패턴 기반 예측 프리로딩
        PredictivePreload(newScene);
    }
    
    void PredictivePreload(string currentScene)
    {
        // 씬 전환 패턴 분석 후 다음 씬 예측 프리로딩
        var sceneHistory = recentScenes.ToArray();
        
        // 간단한 패턴 매칭 (실제로는 더 복잡한 ML 알고리즘 적용 가능)
        if (sceneHistory.Length >= 3)
        {
            string predictedNext = PredictNextScene(sceneHistory);
            if (!string.IsNullOrEmpty(predictedNext))
            {
                var sceneConfig = FindObjectOfType<SceneLoadingManager>()?.sceneConfigs
                    ?.FirstOrDefault(c => c.sceneName == predictedNext);
                
                if (sceneConfig != null)
                {
                    // 예측된 씬의 에셋 사전 로딩
                    foreach (var groupName in sceneConfig.requiredAssetGroups)
                    {
                        if (!AppsInTossLoadingManager.Instance.IsGroupLoaded(groupName))
                        {
                            StartCoroutine(PreloadAssetGroup(groupName));
                        }
                    }
                }
            }
        }
    }
    
    string PredictNextScene(string[] sceneHistory)
    {
        // 간단한 패턴 매칭 로직
        // 실제 구현에서는 머신러닝 또는 더 정교한 예측 알고리즘 사용
        return null; // 구현 필요
    }
}
```

***

## 6. 성능 모니터링 및 최적화

### 로딩 성능 분석 도구

```c#
public class LoadingPerformanceAnalyzer : MonoBehaviour
{
    [System.Serializable]
    public class LoadingMetrics
    {
        public string assetGroup;
        public float loadTime;
        public int assetCount;
        public long memoryUsage;
        public bool success;
        public string errorMessage;
        public System.DateTime timestamp;
    }
    
    private List<LoadingMetrics> performanceHistory = new List<LoadingMetrics>();
    private const int maxHistorySize = 100;
    
    void Start()
    {
        // 로딩 이벤트 구독
        if (AppsInTossLoadingManager.Instance != null)
        {
            AppsInTossLoadingManager.Instance.OnGroupLoadingComplete += OnGroupLoadingComplete;
        }
    }
    
    void OnGroupLoadingComplete(string groupName)
    {
        AnalyzeLoadingPerformance(groupName);
    }
    
    void AnalyzeLoadingPerformance(string groupName)
    {
        var metrics = new LoadingMetrics
        {
            assetGroup = groupName,
            loadTime = Time.realtimeSinceStartup,
            memoryUsage = UnityEngine.Profiling.Profiler.GetTotalAllocatedMemory(false),
            success = AppsInTossLoadingManager.Instance.IsGroupLoaded(groupName),
            timestamp = System.DateTime.UtcNow
        };
        
        performanceHistory.Add(metrics);
        
        // 히스토리 크기 제한
        if (performanceHistory.Count > maxHistorySize)
        {
            performanceHistory.RemoveAt(0);
        }
        
        // 성능 이슈 감지
        DetectPerformanceIssues(metrics);
        
        // 앱인토스 분석 시스템에 전송
        SendLoadingAnalytics(metrics);
    }
    
    void DetectPerformanceIssues(LoadingMetrics metrics)
    {
        var issues = new List<string>();
        
        // 로딩 시간 체크
        if (metrics.loadTime > 10f)
        {
            issues.Add($"긴 로딩 시간: {metrics.loadTime:F2}초");
        }
        
        // 메모리 사용량 체크
        long memoryMB = metrics.memoryUsage / (1024 * 1024);
        if (memoryMB > 200)
        {
            issues.Add($"높은 메모리 사용량: {memoryMB}MB");
        }
        
        // 로딩 실패 체크
        if (!metrics.success)
        {
            issues.Add("로딩 실패");
        }
        
        if (issues.Count > 0)
        {
            Debug.LogWarning($"로딩 성능 이슈 감지 [{metrics.assetGroup}]: {string.Join(", ", issues)}");
            
            foreach (var issue in issues)
            {
                AppsInToss.ReportPerformanceIssue($"loading_{metrics.assetGroup}", issue);
            }
        }
    }
    
    void SendLoadingAnalytics(LoadingMetrics metrics)
    {
        var analyticsData = new Dictionary<string, object>
        {
            {"asset_group", metrics.assetGroup},
            {"load_time", metrics.loadTime},
            {"memory_mb", metrics.memoryUsage / (1024f * 1024f)},
            {"success", metrics.success},
            {"device_model", SystemInfo.deviceModel},
            {"timestamp", metrics.timestamp.ToString("o")}
        };
        
        AppsInToss.SendAnalytics("loading_performance", analyticsData);
    }
    
    // 성능 리포트 생성
    public string GeneratePerformanceReport()
    {
        if (performanceHistory.Count == 0)
        {
            return "성능 데이터가 없습니다.";
        }
        
        var report = new System.Text.StringBuilder();
        report.AppendLine("=== 로딩 성능 리포트 ===");
        report.AppendLine($"분석 기간: {performanceHistory.First().timestamp:yyyy-MM-dd HH:mm:ss} ~ {performanceHistory.Last().timestamp:yyyy-MM-dd HH:mm:ss}");
        report.AppendLine();
        
        // 전체 통계
        float avgLoadTime = performanceHistory.Average(m => m.loadTime);
        float maxLoadTime = performanceHistory.Max(m => m.loadTime);
        float avgMemoryMB = performanceHistory.Average(m => m.memoryUsage) / (1024f * 1024f);
        float successRate = performanceHistory.Count(m => m.success) / (float)performanceHistory.Count * 100f;
        
        report.AppendLine($"평균 로딩 시간: {avgLoadTime:F2}초");
        report.AppendLine($"최대 로딩 시간: {maxLoadTime:F2}초");
        report.AppendLine($"평균 메모리 사용량: {avgMemoryMB:F1}MB");
        report.AppendLine($"성공률: {successRate:F1}%");
        report.AppendLine();
        
        // 그룹별 통계
        var groupStats = performanceHistory
            .GroupBy(m => m.assetGroup)
            .Select(g => new {
                Group = g.Key,
                AvgTime = g.Average(m => m.loadTime),
                MaxTime = g.Max(m => m.loadTime),
                Count = g.Count(),
                SuccessRate = g.Count(m => m.success) / (float)g.Count() * 100f
            });
        
        report.AppendLine("=== 에셋 그룹별 성능 ===");
        foreach (var stat in groupStats.OrderByDescending(s => s.AvgTime))
        {
            report.AppendLine($"[{stat.Group}] 평균: {stat.AvgTime:F2}초, 최대: {stat.MaxTime:F2}초, 성공률: {stat.SuccessRate:F1}% ({stat.Count}회)");
        }
        
        return report.ToString();
    }
    
    // 최적화 제안 생성
    public List<string> GenerateOptimizationSuggestions()
    {
        var suggestions = new List<string>();
        
        if (performanceHistory.Count == 0) return suggestions;
        
        // 느린 로딩 그룹 식별
        var slowGroups = performanceHistory
            .GroupBy(m => m.assetGroup)
            .Where(g => g.Average(m => m.loadTime) > 5f)
            .Select(g => g.Key);
        
        foreach (var group in slowGroups)
        {
            suggestions.Add($"{group} 그룹의 로딩 시간 최적화 필요 (5초 초과)");
        }
        
        // 높은 메모리 사용량 그룹
        var memoryIntensiveGroups = performanceHistory
            .GroupBy(m => m.assetGroup)
            .Where(g => g.Average(m => m.memoryUsage) > 100 * 1024 * 1024) // 100MB
            .Select(g => g.Key);
        
        foreach (var group in memoryIntensiveGroups)
        {
            suggestions.Add($"{group} 그룹의 메모리 사용량 최적화 필요 (100MB 초과)");
        }
        
        // 실패율이 높은 그룹
        var unreliableGroups = performanceHistory
            .GroupBy(m => m.assetGroup)
            .Where(g => g.Count(m => !m.success) / (float)g.Count() > 0.1f) // 10% 이상 실패
            .Select(g => g.Key);
        
        foreach (var group in unreliableGroups)
        {
            suggestions.Add($"{group} 그룹의 로딩 안정성 개선 필요 (실패율 10% 이상)");
        }
        
        return suggestions;
    }
}
```

## 7. 체크리스트 및 권장사항

### 로딩 시스템 체크리스트

* 통합 로딩 매니저 구현
* 우선순위 기반 로딩 시스템 적용
* 스마트 에셋 캐싱 시스템 구현
* 씬별 로딩 관리 시스템 설정
* 인텔리전트 프리로딩 시스템 적용
* 메모리 사용량 모니터링 시스템
* 로딩 성능 분석 도구 설치
* 앱인토스 네이티브 연동 확인
* 다양한 기기에서 성능 테스트
* 사용자 행동 패턴 기반 최적화

### 앱인토스 특화 권장사항

1. 토스 브랜딩: 로딩 화면에 토스 디자인 시스템 적용
2. 메모리 제한: 150MB 이내 캐시 메모리 사용량 유지
3. 토스페이 연동: 결제 관련 에셋 사전 로딩
4. 사용자 분석: 앱인토스 분석 시스템과 연동
5. 성능 모니터링: 실시간 성능 데이터 수집 및 분석

효율적인 로딩 시스템은 사용자 경험의 핵심이에요. 우선순위 기반 로딩과 지능적인 캐싱으로 최적의 성능을 달성하세요.
