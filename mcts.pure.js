// MCTS节点类
class MCTSNode {
  constructor(parent = null, action = null, gameState = null) {
    this.parent = parent;         // 父节点
    this.action = action;         // 导致此节点的动作
    this.children = [];           // 子节点数组
    this.wins = 0;                // 赢得的模拟次数
    this.visits = 0;              // 访问次数
    this.untriedActions = [];     // 尚未尝试的动作
    this.playerJustMoved = null;  // 刚刚移动的玩家
    
    if (gameState) {
      this.untriedActions = gameState.getLegalActions();
      this.playerJustMoved = gameState.getCurrentPlayer() * -1;
    }
  }

  // 选择子节点 - UCB1算法
  selectChild() {
    let selected = null;
    let bestValue = -Infinity;
    const explorationFactor = Math.sqrt(2);

    for (const child of this.children) {
      const uctValue = (child.wins / child.visits) + 
                      explorationFactor * Math.sqrt(Math.log(this.visits)) / child.visits;
      
      if (uctValue > bestValue) {
        selected = child;
        bestValue = uctValue;
      }
    }
    
    return selected;
  }

  // 添加子节点
  addChild(action, gameState) {
    const newNode = new MCTSNode(this, action, gameState);
    this.untriedActions = this.untriedActions.filter(a => a !== action);
    this.children.push(newNode);
    return newNode;
  }

  // 更新节点统计信息
  update(result) {
    this.visits += 1;
    this.wins += result;
  }
}

// MCTS算法类
class MCTS {
  constructor(iterations = 1000, explorationFactor = Math.sqrt(2)) {
    this.iterations = iterations;          // 每次移动的模拟次数
    this.explorationFactor = explorationFactor; // 探索因子
  }

  // 获取最佳移动
  getBestMove(gameState) {
    const root = new MCTSNode(null, null, gameState);

    for (let i = 0; i < this.iterations; i++) {
      let node = root;
      let state = gameState.clone();

      // 选择阶段 - 选择最有潜力的节点
      while (node.untriedActions.length === 0 && node.children.length > 0) {
        node = node.selectChild();
        state.performAction(node.action);
      }

      // 扩展阶段 - 如果游戏未结束，扩展一个未尝试的动作
      if (node.untriedActions.length > 0 && !state.isTerminal()) {
        const action = node.untriedActions[Math.floor(Math.random() * node.untriedActions.length)];
        state.performAction(action);
        node = node.addChild(action, state);
      }

      // 模拟阶段 - 随机进行游戏直到结束
      while (!state.isTerminal()) {
        const actions = state.getLegalActions();
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        state.performAction(randomAction);
      }

      // 回溯阶段 - 更新路径上的所有节点
      let result = state.getResult();
      // 从当前玩家的视角调整结果
      if (result === 1e-4) result = 0; // 平局
      
      while (node !== null) {
        // 从节点玩家的视角看结果
        const nodePlayer = node.playerJustMoved;
        const adjustedResult = nodePlayer === result ? 1 : (result === 0 ? 0 : -1);
        node.update(adjustedResult);
        node = node.parent;
      }
    }

    // 选择访问次数最多的子节点
    let bestChild = null;
    let mostVisits = -Infinity;

    for (const child of root.children) {
      if (child.visits > mostVisits) {
        bestChild = child;
        mostVisits = child.visits;
      }
    }

    return bestChild ? bestChild.action : null;
  }
}

// AI玩家类
class Connect4AI {
  constructor(difficulty = 'medium') {
    let iterations;
    switch(difficulty) {
      case 'easy': iterations = 500; break;
      case 'medium': iterations = 1000; break;
      case 'hard': iterations = 2000; break;
      default: iterations = 1000;
    }
    this.mcts = new MCTS(iterations);
  }

  // 获取AI的移动
  getMove(gameState) {
    const legalMoves = gameState.getLegalActions();
    if (legalMoves.length === 0) return null;
    
    // 对于第一个移动，可以硬编码以节省时间（中间列通常最好）
    if (gameState.board.every(item => item === 0)) return 3;
    
    return this.mcts.getBestMove(gameState);
  }
}