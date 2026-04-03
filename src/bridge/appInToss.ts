import {
  generateHapticFeedback,
  loadFullScreenAd,
  showFullScreenAd,
} from '@apps-in-toss/web-framework';

export function hapticSuccess() {
  generateHapticFeedback({ type: 'success' }).catch(() => {});
}

export function hapticError() {
  generateHapticFeedback({ type: 'error' }).catch(() => {});
}

export function hapticTap() {
  generateHapticFeedback({ type: 'tap' }).catch(() => {});
}

export function loadInterstitialAd(adGroupId: string, onLoaded: () => void) {
  if (!loadFullScreenAd.isSupported()) {
    onLoaded();
    return () => {};
  }

  return loadFullScreenAd({
    options: { adGroupId },
    onEvent: (event) => {
      if (event.type === 'loaded') onLoaded();
    },
    onError: () => {},
  });
}

export function showInterstitialAd(adGroupId: string, onDismissed: () => void) {
  if (!showFullScreenAd.isSupported()) {
    onDismissed();
    return () => {};
  }

  return showFullScreenAd({
    options: { adGroupId },
    onEvent: (event) => {
      if (event.type === 'dismissed') onDismissed();
    },
    onError: () => onDismissed(),
  });
}

export async function shareResultImage(canvas: HTMLCanvasElement): Promise<boolean> {
  try {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png'),
    );
    if (!blob) return false;

    const file = new File([blob], 'sense-arena-result.png', { type: 'image/png' });

    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: '감각측정소 결과',
        text: '나의 감각 테스트 결과를 확인해 보세요!',
        files: [file],
      });
      return true;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sense-arena-result.png';
    a.click();
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}
