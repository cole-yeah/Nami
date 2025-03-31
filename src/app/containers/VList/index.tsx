import React, { useState, useRef, useEffect, useCallback, memo } from "react";

interface Item {
  id: string; // 唯一标识
  content: string; // 内容
}

interface VirtualListProps {
  data: Item[]; // 数据源
  containerHeight: number; // 容器高度
  estimatedItemHeight: number; // 预估的单个项高度（用于初始渲染）
  bufferCount?: number; // 缓冲项的数量，默认值 5
}

// 这个单独抽离出来很重要，当数据量大的时候，组件的状态最好在组件内部控制，避免在父组件，否则会导致不必要的渲染
const DynamicItem = memo(
  ({
    idx,
    data,
    updateH,
    getHeightByIdx,
  }: {
    idx: number;
    data: any;
    updateH: (h: number) => void;
    getHeightByIdx: (idx: number) => number;
  }) => {
    const [isMouted, setIsMouted] = useState(false);
    const top = idx === 0 ? 0 : getHeightByIdx(idx);
    return (
      <div
        key={data.id}
        ref={(el) => {
          if (el) {
            updateH(el.offsetHeight);
            setIsMouted(true);
          }
        }}
        style={{
          position: "absolute",
          top: `${top}px`,
          left: 0,
          right: 0,
          background: "#fff",
          padding: "8px",
          borderBottom: "1px solid #ccc",
          visibility: isMouted ? "visible" : "hidden",
        }}
      >
        {data.content}
      </div>
    );
  }
);

const VirtualList: React.FC<VirtualListProps> = ({
  data,
  containerHeight,
  estimatedItemHeight,
  bufferCount = 5, // 默认缓冲 5 项
}) => {
  const [scrollTop, setScrollTop] = useState(0); // 当前滚动位置
  const containerRef = useRef<HTMLDivElement>(null); // 容器引用
  const itemHeights = useRef<number[]>([]); // 存储每项的实际高度
  const [height, setHeight] = useState(0);
  const [renderList, setRenderList] = useState<number[]>([]); // 渲染的下标

  // 初始化每项的高度为预估值
  useEffect(() => {
    itemHeights.current = new Array(data.length).fill(estimatedItemHeight);
  }, [data, estimatedItemHeight]);

  // 计算累积高度
  const getCumulativeHeight = (index: number) => {
    let h = 0,
      idx = 0;
    while (idx < index) {
      h += itemHeights.current[idx]!;
      idx++;
    }
    return h;
  };

  // 使用二分查找找到起始索引
  const findStartIndex = useCallback(
    (scrollPosition: number): number => {
      let sum = 0,
        idx = 0;

      while (sum < scrollPosition) {
        const itemH = itemHeights.current[idx];
        sum += itemH;
        idx++;
      }
      return Math.max(0, idx - bufferCount); // 加入缓冲项
    },
    [bufferCount]
  );

  // 找到结束索引
  const findEndIndex = useCallback(
    (startIndex: number): number => {
      let endIndex = startIndex;
      let totalHeight = 0;
      for (let i = startIndex; i < data.length; i++) {
        totalHeight += itemHeights.current[i];
        endIndex = i;

        if (totalHeight > containerHeight + bufferCount * estimatedItemHeight)
          break;
      }
      return Math.min(data.length - 1, endIndex + bufferCount); // 加入缓冲项
    },
    [bufferCount, containerHeight, data.length, estimatedItemHeight]
  );

  // 处理滚动事件
  const handleScroll = () => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  };

  useEffect(() => {
    // 计算起始和结束索引
    const startIndex = findStartIndex(scrollTop);
    const endIndex = findEndIndex(startIndex);
    const idxArr = Array.from(
      { length: endIndex - startIndex },
      (_, i) => i + startIndex
    );
    setRenderList(idxArr);
  }, [findEndIndex, findStartIndex, scrollTop]);

  useEffect(() => {
    const height = data?.length ? getCumulativeHeight(data.length - 1) : 0;
    setHeight(height);
  }, [data.length]);

  const updateH = useCallback((idx: number, h: number) => {
    itemHeights.current[idx] = h;
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        position: "relative",
        overflowY: "auto",
        height: `${containerHeight}px`,
        border: "1px solid #ccc",
      }}
    >
      {/* 占位高度 */}
      <div style={{ height }}></div>
      {/* 可见区域 */}
      {renderList.map((idx) => {
        const item = data[idx]!;
        return (
          <DynamicItem
            key={item.id}
            idx={idx}
            data={item}
            updateH={(h) => updateH(idx, h)}
            getHeightByIdx={getCumulativeHeight}
          />
        );
      })}
    </div>
  );
};

const App: React.FC = () => {
  const data = Array.from({ length: 100000 }, (_, i) => ({
    id: `item-${i}`,
    content: `row ${i + 1} 项: ${"内容长度可能不同".repeat(
      Math.floor(Math.random() * 5) + 1
    )}`,
  }));
  return (
    <div>
      <VirtualList data={data} containerHeight={500} estimatedItemHeight={50} />
    </div>
  );
};

export default App;
