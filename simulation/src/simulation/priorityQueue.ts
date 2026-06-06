export class PriorityQueue<T> {
  private heap: T[] = [];

  constructor(private readonly less: (left: T, right: T) => boolean) {}

  get length(): number {
    return this.heap.length;
  }

  push(value: T): void {
    this.heap.push(value);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): T | undefined {
    if (this.heap.length === 0) {
      return undefined;
    }

    const top = this.heap[0];
    const end = this.heap.pop();
    if (end !== undefined && this.heap.length > 0) {
      this.heap[0] = end;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(index: number): void {
    let current = index;
    const value = this.heap[current];

    while (current > 0) {
      const parentIndex = Math.floor((current - 1) / 2);
      const parent = this.heap[parentIndex];
      if (!this.less(value, parent)) {
        break;
      }
      this.heap[current] = parent;
      current = parentIndex;
    }

    this.heap[current] = value;
  }

  private sinkDown(index: number): void {
    let current = index;
    const value = this.heap[current];

    while (true) {
      const leftIndex = current * 2 + 1;
      const rightIndex = leftIndex + 1;
      let swapIndex = -1;

      if (leftIndex < this.heap.length && this.less(this.heap[leftIndex], value)) {
        swapIndex = leftIndex;
      }

      if (rightIndex < this.heap.length) {
        const candidate = swapIndex === -1 ? value : this.heap[leftIndex];
        if (this.less(this.heap[rightIndex], candidate)) {
          swapIndex = rightIndex;
        }
      }

      if (swapIndex === -1) {
        break;
      }

      this.heap[current] = this.heap[swapIndex];
      current = swapIndex;
    }

    this.heap[current] = value;
  }
}
