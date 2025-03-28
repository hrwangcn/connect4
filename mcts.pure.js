// MCTS�ڵ���
class MCTSNode {
  constructor(parent = null, action = null, gameState = null) {
    this.parent = parent;         // ���ڵ�
    this.action = action;         // ���´˽ڵ�Ķ���
    this.children = [];           // �ӽڵ�����
    this.wins = 0;                // Ӯ�õ�ģ�����
    this.visits = 0;              // ���ʴ���
    this.untriedActions = [];     // ��δ���ԵĶ���
    this.playerJustMoved = null;  // �ո��ƶ������
    
    if (gameState) {
      this.untriedActions = gameState.getLegalActions();
      this.playerJustMoved = gameState.getCurrentPlayer() * -1;
    }
  }

  // ѡ���ӽڵ� - UCB1�㷨
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

  // ����ӽڵ�
  addChild(action, gameState) {
    const newNode = new MCTSNode(this, action, gameState);
    this.untriedActions = this.untriedActions.filter(a => a !== action);
    this.children.push(newNode);
    return newNode;
  }

  // ���½ڵ�ͳ����Ϣ
  update(result) {
    this.visits += 1;
    this.wins += result;
  }
}

// MCTS�㷨��
class MCTS {
  constructor(iterations = 1000, explorationFactor = Math.sqrt(2)) {
    this.iterations = iterations;          // ÿ���ƶ���ģ�����
    this.explorationFactor = explorationFactor; // ̽������
  }

  // ��ȡ����ƶ�
  getBestMove(gameState) {
    const root = new MCTSNode(null, null, gameState);

    for (let i = 0; i < this.iterations; i++) {
      let node = root;
      let state = gameState.clone();

      // ѡ��׶� - ѡ������Ǳ���Ľڵ�
      while (node.untriedActions.length === 0 && node.children.length > 0) {
        node = node.selectChild();
        state.performAction(node.action);
      }

      // ��չ�׶� - �����Ϸδ��������չһ��δ���ԵĶ���
      if (node.untriedActions.length > 0 && !state.isTerminal()) {
        const action = node.untriedActions[Math.floor(Math.random() * node.untriedActions.length)];
        state.performAction(action);
        node = node.addChild(action, state);
      }

      // ģ��׶� - ���������Ϸֱ������
      while (!state.isTerminal()) {
        const actions = state.getLegalActions();
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        state.performAction(randomAction);
      }

      // ���ݽ׶� - ����·���ϵ����нڵ�
      let result = state.getResult();
      // �ӵ�ǰ��ҵ��ӽǵ������
      if (result === 1e-4) result = 0; // ƽ��
      
      while (node !== null) {
        // �ӽڵ���ҵ��ӽǿ����
        const nodePlayer = node.playerJustMoved;
        const adjustedResult = nodePlayer === result ? 1 : (result === 0 ? 0 : -1);
        node.update(adjustedResult);
        node = node.parent;
      }
    }

    // ѡ����ʴ��������ӽڵ�
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

// AI�����
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

  // ��ȡAI���ƶ�
  getMove(gameState) {
    const legalMoves = gameState.getLegalActions();
    if (legalMoves.length === 0) return null;
    
    // ���ڵ�һ���ƶ�������Ӳ�����Խ�ʡʱ�䣨�м���ͨ����ã�
    if (gameState.board.every(item => item === 0)) return 3;
    
    return this.mcts.getBestMove(gameState);
  }
}