import { Chess } from 'chess.js';

class ChessGameClient {
  constructor(playerColor, socket) {
    this.game = new Chess();
    this.playerColor = playerColor; // 'w' hoặc 'b'
    this.socket = socket;
    this.premoveQueue = []; // Lưu danh sách các premove
  }

  // Người dùng thao tác kéo thả trên bàn cờ
  onUserPieceDrop(sourceSquare, targetSquare, piece) {
    const isMyTurn = this.game.turn() === this.playerColor;

    if (isMyTurn) {
      // 1. Nếu đang là lượt mình -> đi bình thường
      this.executeNormalMove(sourceSquare, targetSquare);
    } else {
      // 2. Chưa tới lượt -> xử lý Pre-move
      this.handlePremoveInput(sourceSquare, targetSquare, piece);
    }
  }

  handlePremoveInput(from, to, piece) {
    // Chess.com cho phép premove nếu hình thức cơ bản của quân cờ cho phép
    // Có thể cho phép nhiều premove liên tiếp
    const premove = { from, to, promotion: 'q' };
    
    // Lưu vào queue
    this.premoveQueue.push(premove);
    
    // Trigger event cập nhật giao diện (vẽ ô viền đỏ)
    this.renderPremoveHighlight(from, to);
  }

  // Gọi khi nhận event 'opponent_moved' từ WebSocket
  onOpponentMoveReceived(moveData) {
    // 1. Áp dụng nước đi của đối thủ vào board logic
    this.game.move(moveData);
    this.updateBoardUI();

    // 2. Kiểm tra nếu có premove đang chờ
    if (this.premoveQueue.length > 0) {
      const nextMove = this.premoveQueue.shift(); // Lấy nước đi đầu tiên

      // Kiểm tra tính hợp lệ trên trạng thái bàn cờ MỚI
      const validMove = this.game.move({
        from: nextMove.from,
        to: nextMove.to,
        promotion: nextMove.promotion
      });

      if (validMove) {
        // Nước đi hợp lệ -> gửi ngay lập tức lên server
        this.socket.emit('make_move', {
          move: validMove,
          isPremove: true
        });
        this.updateBoardUI();
        this.clearPremoveHighlight(nextMove.from, nextMove.to);
      } else {
        // Premove không hợp lệ -> Hủy toàn bộ chuỗi premove kế tiếp
        this.cancelAllPremoves();
      }
    }
  }

  // Hủy bỏ premove khi click chuột phải hoặc khi nước đi bị lỗi
  cancelAllPremoves() {
    this.premoveQueue = [];
    this.clearAllPremoveHighlights();
  }
}