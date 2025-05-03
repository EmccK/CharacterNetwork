import { useGraphStore } from '@/components/relationship/graph/graphStore';
import { useCallback } from 'react';

/**
 * 封装图形变换状态和操作的钩子
 */
export function useGraphTransform() {
  const { 
    transform, 
    setTransform, 
    resetTransform, 
    zoomIn, 
    zoomOut,
    updatePanPosition,
  } = useGraphStore();

  /**
   * 根据鼠标位置执行缩放
   * @param scale 新的缩放比例
   * @param mouseX 鼠标X坐标
   * @param mouseY 鼠标Y坐标
   */
  const zoomAtPosition = useCallback((scale: number, mouseX: number, mouseY: number) => {
    setTransform({
      x: mouseX - (mouseX - transform.x) * (scale / transform.scale),
      y: mouseY - (mouseY - transform.y) * (scale / transform.scale),
      scale,
    });
  }, [transform, setTransform]);

  /**
   * 执行缩放操作，带有鼠标位置感知
   * @param delta 滚轮增量值
   * @param mouseX 鼠标X坐标
   * @param mouseY 鼠标Y坐标
   */
  const handleZoom = useCallback((delta: number, mouseX: number, mouseY: number) => {
    const zoomSensitivity = 0.002;
    const zoom = Math.abs(delta) * zoomSensitivity;
    const scaleFactor = delta > 0 ? (1 - zoom) : (1 + zoom);
    const newScale = Math.max(0.1, Math.min(3, transform.scale * scaleFactor));
    
    zoomAtPosition(newScale, mouseX, mouseY);
  }, [transform.scale, zoomAtPosition]);

  /**
   * 居中并重置视图
   * @param width 画布宽度
   * @param height 画布高度
   */
  const centerView = useCallback((width?: number, height?: number) => {
    if (width && height) {
      setTransform({ 
        x: width / 2, 
        y: height / 2, 
        scale: 1 
      });
    } else {
      resetTransform();
    }
  }, [setTransform, resetTransform]);

  return {
    transform,
    setTransform,
    resetTransform,
    zoomIn,
    zoomOut,
    zoomAtPosition,
    handleZoom,
    centerView,
    pan: updatePanPosition,
  };
}
