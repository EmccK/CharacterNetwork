import React, { useState } from 'react';
import { useGraphStore } from './graphStore';
import { PlusCircle, Maximize } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface GraphControlsProps {
  resetAndCenterView: () => void;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
}

const GraphControls: React.FC<GraphControlsProps> = ({
  resetAndCenterView,
  toggleFullscreen,
  isFullscreen
}) => {
  return (
    <div className="absolute bottom-5 right-5 flex space-x-2 justify-end">
      <Button
        onClick={resetAndCenterView}
        className="rounded-full bg-white p-2 shadow-md hover:bg-gray-50 transition-colors"
        size="icon"
        variant="ghost"
        title="中心化视图"
      >
        <Maximize className="w-5 h-5 text-green-500" />
      </Button>
      <Button
        onClick={toggleFullscreen}
        className="rounded-full bg-white p-2 shadow-md hover:bg-gray-50 transition-colors"
        size="icon"
        variant="ghost"
        title={isFullscreen ? "退出全屏" : "全屏显示"}
      >
        {isFullscreen ? 
          <Maximize className="w-5 h-5 text-blue-500 rotate-45" /> : 
          <Maximize className="w-5 h-5 text-blue-500" />}
      </Button>
    </div>
  );
};

export default GraphControls;
