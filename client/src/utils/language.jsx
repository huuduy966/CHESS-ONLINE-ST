import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const LanguageContext = createContext(null)

export const TRANSLATIONS = {
  vi: {
    // Navbar
    home: 'Trang chủ',
    online: 'Chơi Online',
    ai: 'Chơi với Máy',
    local: 'Chơi với Bạn',
    profile: 'Hồ sơ',
    login: 'Đăng nhập',
    register: 'Đăng ký',
    logout: 'Đăng xuất',
    themeLight: 'Chuyển sáng',
    themeDark: 'Chuyển tối',
    langVi: 'Tiếng Việt',
    langEn: 'English',
    back: 'Quay lại',

    // Home Page
    heroTitle1: 'ĐẤU TRÍ ĐỈNH CAO CÙNG',
    heroTitle2: 'CHESS ONLINE',
    heroSubtitle: 'Trải nghiệm cờ vua đỉnh cao: Ghép trận trực tuyến thời gian thực, đấu trí với Stockfish 19 Engine thông minh, và so tài cùng bạn bè mọi lúc mọi nơi.',
    bentoOnlineTag: 'Multiplayer Real-time',
    bentoOnlineTitle: 'Chơi Online',
    bentoOnlineDesc: 'Ghép trận tự động theo ELO, so tài trực tuyến cùng các kỳ thủ toàn cầu.',
    badgeFastMatch: 'Ghép trận nhanh',
    badgeRankedElo: 'Đấu hạng ELO',
    badgeGlobal: 'Toàn cầu',
    ctaOnline: 'Vào sảnh Online',

    bentoAiTag: 'Stockfish 19 UCI Engine',
    bentoAiTitle: 'Chơi với Máy (Stockfish 19)',
    bentoAiDesc: 'Đấu trí cùng Stockfish 19 với 11 cấp độ, từ 800 đến 3200+ Elo.',
    badgeSf19: 'Stockfish 19',
    badge11Levels: '11 Cấp độ (800-3200)',
    ctaAi: 'Thách đấu Stockfish',

    bentoLocalTag: 'Pass & Play / Private Room',
    bentoLocalTitle: 'Chơi với Bạn bè',
    bentoLocalDesc: 'Đấu 2 người trên cùng thiết bị hoặc tạo phòng riêng qua mã PIN.',
    badgeLocal2P: '2 Người tại chỗ',
    badgePinRoom: 'Phòng riêng PIN',
    badgeMultiDevice: 'Đa thiết bị',
    ctaLocal: 'Chơi cùng bạn bè',

    featSf19Title: 'Stockfish 19',
    featSf19Sub: 'UCI & NNUE Engine',
    featRealtimeTitle: 'Thời gian thực',
    featRealtimeSub: 'Socket.io siêu tốc',
    featEloTitle: 'Hệ thống ELO',
    featEloSub: '800 - 2800 Rank',
    featReviewTitle: 'Xem lại ván cờ',
    featReviewSub: 'Phân tích sai lầm',

    chessTipTitle: 'Mẹo cờ vua cho kỳ thủ:',
    chessTipDesc: '"Kiểm soát các ô trung tâm (d4, e4, d5, e5), phát triển quân nhẹ sớm và nhập thành để bảo vệ Vua an toàn trước khi mở thế công."',

    liveMatchBadge: 'VÁN CỜ TRỰC TIẾP · 2100 ELO',
    liveMatchTitle: 'Ván cờ trực tiếp',
    turnLabel: 'Lượt:',
    turnWhite: 'Trắng',
    turnBlack: 'Đen',
    moveCountLabel: 'Nước đi:',
    openingBook: 'Khai cuộc:',

    // Online Lobby
    onlineLobbyTag: 'SẢNH ĐẤU ONLINE',
    chooseCategoryTitle: 'Chọn thể loại thi đấu',
    chooseCategoryDesc: 'Chọn thời gian ván cờ theo các ô bên dưới rồi nhấn tìm trận tự động hoặc tạo phòng riêng.',
    serverReady: 'Máy chủ sẵn sàng',
    serverOffline: 'Mất kết nối máy chủ',
    standardEloMode: 'Tính điểm Elo chuẩn',
    autoFindMatch: 'Tìm trận tự động',
    matchingTitle: 'ĐANG GHÉP TRẬN...',
    searchingOpponentNote: 'Đang tìm kiếm đối thủ phù hợp...',
    cancelMatchBtn: 'Hủy ghép trận',
    orPlayWithFriends: 'HOẶC CHƠI CÙNG BẠN BÈ',
    createPrivateRoomTitle: 'Tạo phòng riêng tư',
    createPrivateRoomDesc: 'Tạo phòng và lấy mã PIN để mời bạn bè vào đấu',
    createRoomBtn: 'Tạo phòng mới',
    joinWithCodeTitle: 'Vào bằng mã phòng',
    joinWithCodeDesc: 'Nhập mã PIN phòng bạn bè gửi cho bạn',
    pinPlaceholder: 'VD: AB12CD',
    joinRoomBtn: 'Vào phòng',
    roomCodeRequired: 'Vui lòng nhập mã phòng',

    // AI Game
    botSelectBrand: 'STOCKFISH 19 UCI ENGINE (NNUE)',
    botSelectTitle: 'Chọn cấp độ đấu với Stockfish',
    botSelectDesc: 'Trải nghiệm đấu cờ với động cơ Stockfish 19 hàng đầu thế giới. Lựa chọn cấp độ từ người mới bắt đầu (800 Elo) đến Đại kiện tướng quốc tế (3200+ Elo).',
    chooseSideLabel: 'Bạn muốn cầm quân:',
    playWhiteFirst: 'Cầm Trắng (Đi trước)',
    playRandomSide: 'Ngẫu nhiên quân',
    playBlackSecond: 'Cầm Đen (Đi sau)',
    aiGameTypeTitle: 'Hình thức thi đấu:',
    practiceModeTitle: 'Tập luyện',
    practiceModeBadge: 'Có gợi ý',
    practiceModeDesc: 'Có gợi ý nước đi từ Stockfish 19, tự do đổi quân và bắt đầu lại ván cờ.',
    challengeModeTitle: 'Thách đấu',
    challengeModeBadge: 'Nghiêm túc',
    challengeModeDesc: 'Không có gợi ý, không đổi quân, không bắt đầu lại, chỉ có đầu hàng.',
    practiceModeTag: 'Đấu máy - Tập luyện',
    challengeModeTag: 'Đấu máy - Thách đấu',
    loginEloNoticeAI: 'Chế độ chơi với máy không tính điểm Elo. Ván đấu vẫn được lưu lại để bạn xem lại và phân tích.',
    unratedMatchTag: 'Đấu máy (Không tính Elo)',
    gameModeLabel: 'Chế độ thi đấu',
    unratedShort: 'Không tính Elo',
    sf19EvalTitle: 'Đánh giá Stockfish 19:',
    whiteAdvantage: 'Trắng ưu',
    blackAdvantage: 'Đen ưu',
    equalEval: 'Cân bằng',
    whiteMates: 'Trắng chiếu hết',
    blackMates: 'Đen chiếu hết',
    getHintBtn: 'Gợi ý từ Stockfish 19',
    analyzingHint: 'Stockfish đang phân tích...',
    closeHint: 'Tắt gợi ý',
    optimalMoveLabel: 'Nước tối ưu:',
    evalScoreLabel: 'Đánh giá:',
    depthPlyLabel: 'Độ sâu',
    resign: 'Đầu hàng',
    changeLevel: 'Chọn cấp độ khác',
    swapSideWhite: 'Đang cầm Trắng (Đổi quân)',
    swapSideBlack: 'Đang cầm Đen (Đổi quân)',
    restartGame: 'Bắt đầu lại',
    matchStatusTitle: 'Trạng thái trận đấu',
    moveHistoryTitle: 'Lịch sử nước đi',
    sfThinkingText: 'Stockfish 19 đang tính toán...',

    // Online Game
    roomPrefix: 'Phòng',
    youAre: 'Bạn:',
    whiteSeat: 'Trắng',
    blackSeat: 'Đen',
    spectatorSeat: 'Khán giả',
    spectatorsCount: 'khán giả',
    waitingOpponentJoin: '(chờ người vào)',
    youIndicator: '(Bạn)',
    shareRoomCodeTip: 'Mã phòng:',
    shareRoomCodeSuffix: '— chia sẻ cho đối thủ',
    leaveRoomNeedResign: 'Rời phòng (Cần đầu hàng)',
    leaveRoom: 'Rời phòng',
    roomChatTitle: 'Trò chuyện phòng',
    noMessagesInRoom: 'Chưa có tin nhắn nào trong phòng',
    chatPlaceholder: 'Nhập tin nhắn...',
    sendChatBtn: 'Gửi',
    turnYours: 'Đến lượt bạn đi',
    waitingOpponentMove: 'Chờ đối thủ ra nước cờ...',
    youAreSpectating: 'Bạn đang xem trận đấu',
    chatTab: 'Trò chuyện',
    movesTab: 'Nước đi',
    splitTab: 'Cả hai',
    quickGreetingsPrompt: 'Gửi lời chào hoặc lời chúc đối thủ để bắt đầu cuộc trò chuyện!',
    quickHello: '👋 Xin chào!',
    quickGoodLuck: '🍀 Chúc may mắn!',
    quickNiceMatch: '⚔️ Đấu hay nhé!',
    quickNiceMove: '👏 Nước cờ hay!',
    quickDrawOffer: '🤝 Đề nghị hòa cờ?',
    quickTense: '😅 Căng thẳng quá!',
    onlineStatus: 'Trực tuyến',
    totalMoves: 'Tổng số nước:',
    copyPgnBtn: 'Sao chép PGN',
    copiedPgn: 'Đã chép!',
    moveNumberPrefix: 'Nước',

    // Game Results & Labels
    youWon: 'Bạn thắng!',
    youLost: 'Bạn thua',
    drawMatch: 'Hòa cờ',
    gameOver: 'Kết thúc ván',
    youResignedSub: 'Bạn đã đầu hàng',
    oppResignedSub: 'Đối thủ đã đầu hàng',
    timeoutSub: 'Hết giờ',
    checkmateSub: 'Chiếu hết',
    stalemateSub: 'Hết nước đi (Hòa)',
    rematchBtn: 'Tái đấu',
    rematchSent: 'Đã gửi lời mời...',
    rematchReceived: 'Đồng ý tái đấu',
    rematchDeclined: 'Đối thủ đã từ chối',
    rematchSwapColor: 'Tái đấu (đổi màu)',
    reviewMatchBtn: 'Xem lại trận',
    returnHomeBtn: 'Về sảnh',
    returnHomeDirect: 'Về trang chủ',

    // Local Game
    localTag: 'Chơi với Bạn bè',
    localPassPlayTitle: 'Đấu 2 người tại chỗ',
    localPassPlayDesc: 'Hai người chơi luân phiên trên cùng một thiết bị (Pass & Play). Kéo thả quân cờ hoặc click chọn ô để di chuyển.',
    undoMoveBtn: 'Hoàn tác nước đi',
    restartLocalMatch: 'Bắt đầu lại ván cờ',
    remoteFriendTitle: 'Bạn ở xa?',
    remoteFriendDesc: 'Tạo phòng online riêng tư và gửi mã PIN để đấu từ xa.',
    createOnlineBtn: 'Tạo phòng riêng online',
    playAgainLocal: 'Chơi lại ván mới',

    // Profile Page
    notLoggedInTitle: 'Chưa đăng nhập',
    notLoggedInDesc: 'Vui lòng đăng nhập để lưu trữ lịch sử thi đấu, thống kê Elo và xem lại các ván cờ.',
    loginNow: 'Đăng nhập ngay',
    createNewAcc: 'Tạo tài khoản mới',
    loadingProfile: 'Đang tải hồ sơ...',
    chessPlayerTag: 'Kỳ thủ',
    joinedDatePrefix: 'Tham gia:',
    eloRatingTitle: 'Điểm xếp hạng Elo',
    victoryLabel: 'Chiến thắng',
    drawLabel: 'Hòa cờ',
    defeatLabel: 'Thất bại',
    winRateLabel: 'Tỉ lệ thắng',
    totalGamesLabel: 'Tổng số ván:',
    gamesSuffix: 'trận',
    peakEloLabel: 'Elo cao nhất:',
    vsBotLabel: 'Đấu với Máy:',
    vsOnlineLabel: 'Đấu Online:',
    matchesSuffix: 'ván',
    streakLabel: 'Phong độ:',
    winStreak: 'Chuỗi Thắng',
    lossStreak: 'Chuỗi Thua',
    drawStreak: 'Chuỗi Hòa',
    matchLogsTag: 'NHẬT KÝ THI ĐẤU',
    matchHistoryMainTitle: 'Lịch sử trận đấu',
    matchHistoryTip: 'Bấm vào bất kỳ trận đấu nào bên dưới để mở bàn cờ xem lại và phân tích cùng Stockfish 19.',
    filterAll: 'Tất cả',
    filterOnline: 'Online',
    filterAI: 'Đấu Máy',
    filterWin: 'Thắng',
    filterLoss: 'Thua',
    noMatchesYet: 'Bạn chưa có trận đấu nào. Hãy vào "Chơi với Máy" hoặc "Chơi Online" để thi đấu.',
    noMatchesFiltered: 'Không có trận đấu nào khớp với bộ lọc đã chọn.',
    reviewRowCTA: 'Xem lại',
    noPgnText: 'Không có PGN',
    modeLabelAI: 'Đấu với Stockfish',
    modeLabelOnline: 'Trực tuyến Online',
    winStatus: 'Thắng',
    lossStatus: 'Thua',
    drawStatus: 'Hòa',

    // Review Page
    reviewTopTag: 'STOCKFISH 19 GAME REVIEW & ANALYSIS',
    reviewMainTitle: 'Phân tích ván đấu',
    noReviewDataTitle: 'Không có dữ liệu ván đấu',
    noReviewDataDesc: 'Không tìm thấy lịch sử nước cờ để phân tích. Hãy hoàn thành một ván đấu trước khi xem lại.',
    analyzingReviewTitle: 'Đang phân tích ván đấu với Stockfish 19...',
    analyzingReviewDesc: 'Động cơ Stockfish 19 chính thức đang đánh giá chi tiết các nước đi, tính toán thế trận và chấm điểm độ chính xác.',
    accuracyLabel: 'Độ chính xác',
    whiteRoleSub: 'Quân Trắng',
    blackRoleSub: 'Quân Đen',
    moveQualityTitle: 'Thống kê chất lượng nước đi',
    classificationHead: 'Phân loại',
    sf19AccuracyTitle: 'Độ chính xác Stockfish 19',
    jumpToMove: 'Xem nước',
    controlTipsTitle: 'Mẹo điều khiển',
    controlTipsDesc: 'Dùng phím mũi tên ← và → trên bàn phím để tua lùi hoặc tiến từng nước đi. Phím Space để bật/tắt tự động phát lại.',
    currentPositionTitle: 'Thế trận hiện tại:',
    whiteFavored: 'Trắng chiếm ưu',
    blackFavored: 'Đen chiếm ưu',
    balancedPosition: 'Thế trận cân bằng',
    stepStartTip: 'Về đầu ván',
    stepBackTip: 'Lùi 1 nước (Phím ←)',
    playAutoTip: 'Tự động chạy (Space)',
    pauseAutoTip: 'Tạm dừng (Space)',
    stepNextTip: 'Tiến 1 nước (Phím →)',
    stepEndTip: 'Đến cuối ván',
    flipBoardTip: 'Xoay bàn cờ',
    engineRecommends: 'Engine đề xuất:',
    notationSheetTitle: 'Sổ ghi chép nước đi',

    // Status Bar
    turnWhiteStatus: 'Lượt: Trắng',
    turnBlackStatus: 'Lượt: Đen',
    gameOverStatus: 'Kết thúc ván',
    checkmateTitle: 'Chiếu hết!',
    whiteWonStatus: 'Quân Trắng giành chiến thắng',
    blackWonStatus: 'Quân Đen giành chiến thắng',
    stalemateTitle: 'Hết nước đi hợp lệ',
    threefoldTitle: 'Lặp thế cờ 3 lần',
    insufficientTitle: 'Không đủ quân chiếu hết',
    inCheckNotice: 'đang bị chiếu!',
    inCheckTag: 'Đang chiếu',
    turnTurnOf: 'Lượt đi của',

    // Auth Pages
    loginTitle: 'Đăng nhập',
    usernameLabel: 'Tên đăng nhập',
    passwordLabel: 'Mật khẩu',
    confirmPasswordLabel: 'Xác nhận mật khẩu',
    noAccountYet: 'Chưa có tài khoản?',
    haveAccountAlready: 'Đã có tài khoản?',
    registerTitle: 'Đăng ký',

    // Game Lock Modal
    gameLockTitle: 'Ván đấu đang diễn ra!',
    gameLockDesc: 'Bạn đang trong một trận đấu. Bạn không thể chuyển sang chế độ khác hay thoát ra ngoài trừ khi bạn đầu hàng.',
    resumeMatchBtn: 'Tiếp tục thi đấu',
    resignAndLeaveBtn: 'Đầu hàng & Rời phòng',

    // Classifications
    brilliantTitle: 'Nước cờ thiên tài!',
    brilliantDesc: 'Nước cờ {san} là nước cờ xuất sắc và hiếm có! Bạn đã tìm ra nước đi duy nhất mở toang cơ hội chiến thắng.',
    bestTitle: 'Nước đi hay nhất!',
    bestDesc: 'Nước cờ {san} hoàn toàn trùng khớp với phân tích tối ưu của Stockfish 19. Giữ vững ưu thế tuyệt đối.',
    excellentTitle: 'Nước cờ xuất sắc',
    excellentDesc: 'Nước cờ {san} duy trì thế trận rất tốt theo đánh giá của Stockfish 19.',
    goodTitle: 'Nước cờ tốt',
    goodDesc: 'Nước cờ {san} hợp lý và an toàn cho thế cờ hiện tại.',
    inaccuracyTitle: 'Nước cờ thiếu chính xác',
    inaccuracyDesc: 'Nước cờ {san} làm giảm bớt lợi thế ({cpLoss} cp). {best}',
    mistakeTitle: 'Sai lầm chiến thuật',
    mistakeDesc: 'Nước cờ {san} bỏ lỡ cơ hội quan trọng (mất {cpLoss} cp). {best}',
    blunderTitle: 'Đại sai lầm nghiêm trọng!',
    blunderDesc: 'Nước cờ {san} là sơ hở lớn (mất {cpLoss} cp) có thể thay đổi cục diện ván cờ. {best}',
    playedMoveTitle: 'Nước cờ đã chơi',
    playedMoveDesc: 'Nước cờ {san}.',
    suggestBestMove: 'Stockfish đề xuất nước đi tối ưu hơn là {best}.',

    classBrilliant: 'Thiên tài',
    classBest: 'Hay nhất',
    classExcellent: 'Xuất sắc',
    classGood: 'Tốt',
    classInaccuracy: 'Thiếu chính xác',
    classMistake: 'Sai lầm',
    classBlunder: 'Đại sai lầm',
  },

  en: {
    // Navbar
    home: 'Home',
    online: 'Play Online',
    ai: 'Play vs Bot',
    local: 'Play Friends',
    profile: 'Profile',
    login: 'Log In',
    register: 'Sign Up',
    logout: 'Log Out',
    themeLight: 'Light Theme',
    themeDark: 'Dark Theme',
    langVi: 'Tiếng Việt',
    langEn: 'English',
    back: 'Back',

    // Home Page
    heroTitle1: 'MASTER YOUR MIND WITH',
    heroTitle2: 'CHESS ONLINE',
    heroSubtitle: 'Next-gen chess experience: Real-time online matchmaking, train against Stockfish 19 Engine, and compete with friends anywhere, anytime.',
    bentoOnlineTag: 'Multiplayer Real-time',
    bentoOnlineTitle: 'Play Online',
    bentoOnlineDesc: 'Skill-based matchmaking by ELO, play live with chess enthusiasts worldwide.',
    badgeFastMatch: 'Quick Match',
    badgeRankedElo: 'Ranked ELO',
    badgeGlobal: 'Global',
    ctaOnline: 'Enter Lobby',

    bentoAiTag: 'Stockfish 19 UCI Engine',
    bentoAiTitle: 'Play vs Bot (Stockfish 19)',
    bentoAiDesc: 'Challenge Stockfish 19 across 11 levels, ranging from 800 to 3200+ ELO.',
    badgeSf19: 'Stockfish 19',
    badge11Levels: '11 Levels (800-3200)',
    ctaAi: 'Challenge Stockfish',

    bentoLocalTag: 'Pass & Play / Private Room',
    bentoLocalTitle: 'Play with Friends',
    bentoLocalDesc: '2-player match on the same device or create private rooms via PIN code.',
    badgeLocal2P: '2-Player Local',
    badgePinRoom: 'Private PIN Room',
    badgeMultiDevice: 'Multi-device',
    ctaLocal: 'Play with Friends',

    featSf19Title: 'Stockfish 19',
    featSf19Sub: 'UCI & NNUE Engine',
    featRealtimeTitle: 'Real-time',
    featRealtimeSub: 'Ultra-fast Socket.io',
    featEloTitle: 'ELO System',
    featEloSub: '800 - 2800 Rank',
    featReviewTitle: 'Game Review',
    featReviewSub: 'Blunder Analysis',

    chessTipTitle: 'Pro Chess Tip:',
    chessTipDesc: '"Control central squares (d4, e4, d5, e5), develop minor pieces quickly and castle to secure your King before launching an attack."',

    liveMatchBadge: 'LIVE MATCH · 2100 ELO',
    liveMatchTitle: 'Live Grandmaster Game',
    turnLabel: 'Turn:',
    turnWhite: 'White',
    turnBlack: 'Black',
    moveCountLabel: 'Moves:',
    openingBook: 'Opening:',

    // Online Lobby
    onlineLobbyTag: 'ONLINE LOBBY',
    chooseCategoryTitle: 'Select Time Control',
    chooseCategoryDesc: 'Choose your desired game duration below, then click auto matchmaking or create a private room.',
    serverReady: 'Server connected',
    serverOffline: 'Server disconnected',
    standardEloMode: 'Standard ELO Ranked',
    autoFindMatch: 'Find Match',
    matchingTitle: 'FINDING OPPONENT...',
    searchingOpponentNote: 'Searching for a balanced opponent...',
    cancelMatchBtn: 'Cancel Matchmaking',
    orPlayWithFriends: 'OR PLAY WITH FRIENDS',
    createPrivateRoomTitle: 'Create Private Room',
    createPrivateRoomDesc: 'Create a room and get a PIN code to invite friends',
    createRoomBtn: 'Create Room',
    joinWithCodeTitle: 'Join with Code',
    joinWithCodeDesc: 'Enter the room PIN code sent by your friend',
    pinPlaceholder: 'e.g. AB12CD',
    joinRoomBtn: 'Join Room',
    roomCodeRequired: 'Please enter room code',

    // AI Game
    botSelectBrand: 'STOCKFISH 19 UCI ENGINE (NNUE)',
    botSelectTitle: 'Select Stockfish Difficulty',
    botSelectDesc: 'Experience chess powered by the world\'s #1 engine Stockfish 19. Choose from beginner level (800 ELO) up to Grandmaster level (3200+ ELO).',
    chooseSideLabel: 'Choose your piece color:',
    playWhiteFirst: 'Play White (First move)',
    playRandomSide: 'Random Side (50/50)',
    playBlackSecond: 'Play Black (Second move)',
    aiGameTypeTitle: 'Match Format:',
    practiceModeTitle: 'Practice',
    practiceModeBadge: 'Hints enabled',
    practiceModeDesc: 'Stockfish 19 hints enabled, free to swap side and restart.',
    challengeModeTitle: 'Challenge',
    challengeModeBadge: 'Strict match',
    challengeModeDesc: 'No hints, no side swap, no restart, resign only.',
    practiceModeTag: 'vs Bot - Practice',
    challengeModeTag: 'vs Bot - Challenge',
    loginEloNoticeAI: 'Playing with computer is unrated (no Elo gain or loss). Matches are saved for review and analysis.',
    unratedMatchTag: 'vs Computer (Unrated)',
    gameModeLabel: 'Game Mode',
    unratedShort: 'Unrated',
    sf19EvalTitle: 'Stockfish 19 Evaluation:',
    whiteAdvantage: 'White favored',
    blackAdvantage: 'Black favored',
    equalAdvantage: 'Equal',
    whiteMates: 'White mates',
    blackMates: 'Black mates',
    getHintBtn: 'Stockfish 19 Hint',
    analyzingHint: 'Stockfish is calculating...',
    closeHint: 'Dismiss hint',
    optimalMoveLabel: 'Best Move:',
    evalScoreLabel: 'Eval:',
    depthPlyLabel: 'Depth',
    resign: 'Resign',
    changeLevel: 'Change Bot',
    swapSideWhite: 'Playing White (Swap)',
    swapSideBlack: 'Playing Black (Swap)',
    restartGame: 'Restart',
    matchStatusTitle: 'Match Status',
    moveHistoryTitle: 'Move History',
    sfThinkingText: 'Stockfish 19 is thinking...',

    // Online Game
    roomPrefix: 'Room',
    youAre: 'You:',
    whiteSeat: 'White',
    blackSeat: 'Black',
    spectatorSeat: 'Spectator',
    spectatorsCount: 'spectators',
    waitingOpponentJoin: '(waiting for player)',
    youIndicator: '(You)',
    shareRoomCodeTip: 'Room code:',
    shareRoomCodeSuffix: '— share with opponent',
    leaveRoomNeedResign: 'Leave Room (Resign)',
    leaveRoom: 'Leave Room',
    roomChatTitle: 'Room Chat',
    noMessagesInRoom: 'No chat messages yet',
    chatPlaceholder: 'Type a message...',
    sendChatBtn: 'Send',
    turnYours: 'Your turn to move',
    waitingOpponentMove: 'Waiting for opponent...',
    youAreSpectating: 'You are spectating this match',
    chatTab: 'Chat',
    movesTab: 'Moves',
    splitTab: 'Split',
    quickGreetingsPrompt: 'Send a greeting or wish your opponent good luck to start chatting!',
    quickHello: '👋 Hello!',
    quickGoodLuck: '🍀 Good luck!',
    quickNiceMatch: '⚔️ Have a good game!',
    quickNiceMove: '👏 Nice move!',
    quickDrawOffer: '🤝 Offer draw?',
    quickTense: '😅 So intense!',
    onlineStatus: 'Online',
    totalMoves: 'Total moves:',
    copyPgnBtn: 'Copy PGN',
    copiedPgn: 'Copied!',
    moveNumberPrefix: 'Move',

    // Game Results & Labels
    youWon: 'You Won!',
    youLost: 'You Lost',
    drawMatch: 'Draw',
    gameOver: 'Game Over',
    youResignedSub: 'You resigned',
    oppResignedSub: 'Opponent resigned',
    timeoutSub: 'Out of time',
    checkmateSub: 'Checkmate',
    stalemateSub: 'Stalemate (Draw)',
    rematchBtn: 'Rematch',
    rematchSent: 'Offer sent...',
    rematchReceived: 'Accept Rematch',
    rematchDeclined: 'Opponent declined',
    rematchSwapColor: 'Rematch (swap sides)',
    reviewMatchBtn: 'Review Game',
    returnHomeBtn: 'To Lobby',
    returnHomeDirect: 'Return to Home',

    // Local Game
    localTag: 'Play with Friends',
    localPassPlayTitle: 'Pass & Play (2 Players)',
    localPassPlayDesc: 'Two players take turns on the same screen (Pass & Play). Drag pieces or click squares to make your move.',
    undoMoveBtn: 'Undo move',
    restartLocalMatch: 'Restart match',
    remoteFriendTitle: 'Playing Remotely?',
    remoteFriendDesc: 'Create a private online room and send PIN code to play from anywhere.',
    createOnlineBtn: 'Create Private Room',
    playAgainLocal: 'Play Again',

    // Profile Page
    notLoggedInTitle: 'Not Signed In',
    notLoggedInDesc: 'Please sign in to keep track of your match history, ELO rating, and game reviews.',
    loginNow: 'Sign In Now',
    createNewAcc: 'Create New Account',
    loadingProfile: 'Loading profile...',
    chessPlayerTag: 'Player',
    joinedDatePrefix: 'Member since:',
    eloRatingTitle: 'ELO Rating',
    victoryLabel: 'Victories',
    drawLabel: 'Draws',
    defeatLabel: 'Defeats',
    winRateLabel: 'Win Rate',
    totalGamesLabel: 'Total Games:',
    gamesSuffix: 'matches',
    peakEloLabel: 'Peak ELO:',
    vsBotLabel: 'vs Bot:',
    vsOnlineLabel: 'Online:',
    matchesSuffix: 'games',
    streakLabel: 'Current Streak:',
    winStreak: 'Win Streak',
    lossStreak: 'Loss Streak',
    drawStreak: 'Draw Streak',
    matchLogsTag: 'MATCH LOGS',
    matchHistoryMainTitle: 'Match History',
    matchHistoryTip: 'Click on any match below to open the interactive board and analyze with Stockfish 19.',
    filterAll: 'All',
    filterOnline: 'Online',
    filterAI: 'vs Bot',
    filterWin: 'Wins',
    filterLoss: 'Losses',
    noMatchesYet: 'You have not played any matches yet. Choose "Play vs Bot" or "Play Online" to start.',
    noMatchesFiltered: 'No matches found matching the selected filter.',
    reviewRowCTA: 'Review',
    noPgnText: 'No PGN',
    modeLabelAI: 'vs Stockfish Bot',
    modeLabelOnline: 'Online Match',
    winStatus: 'Win',
    lossStatus: 'Loss',
    drawStatus: 'Draw',

    // Review Page
    reviewTopTag: 'STOCKFISH 19 GAME REVIEW & ANALYSIS',
    reviewMainTitle: 'Game Review & Analysis',
    noReviewDataTitle: 'No Game Data Found',
    noReviewDataDesc: 'No move history found to analyze. Please complete a game before reviewing.',
    analyzingReviewTitle: 'Analyzing game with Stockfish 19...',
    analyzingReviewDesc: 'Official Stockfish 19 engine is analyzing each move, evaluating position advantages, and calculating player accuracy.',
    accuracyLabel: 'Accuracy',
    whiteRoleSub: 'White Player',
    blackRoleSub: 'Black Player',
    moveQualityTitle: 'Move Quality Breakdown',
    classificationHead: 'Classification',
    sf19AccuracyTitle: 'Stockfish 19 Accuracy',
    jumpToMove: 'Jump to',
    controlTipsTitle: 'Navigation Tips',
    controlTipsDesc: 'Use ← and → arrow keys on your keyboard to navigate through moves. Press Space to toggle auto replay.',
    currentPositionTitle: 'Current Position:',
    whiteFavored: 'White is better',
    blackFavored: 'Black is better',
    balancedPosition: 'Equal position',
    stepStartTip: 'Go to start',
    stepBackTip: 'Previous move (← key)',
    playAutoTip: 'Auto play (Space)',
    pauseAutoTip: 'Pause (Space)',
    stepNextTip: 'Next move (→ key)',
    stepEndTip: 'Go to end',
    flipBoardTip: 'Flip board',
    engineRecommends: 'Engine suggests:',
    notationSheetTitle: 'Notation Score Sheet',

    // Status Bar
    turnWhiteStatus: 'Turn: White',
    turnBlackStatus: 'Turn: Black',
    gameOverStatus: 'Game Over',
    checkmateTitle: 'Checkmate!',
    whiteWonStatus: 'White wins the game',
    blackWonStatus: 'Black wins the game',
    stalemateTitle: 'Stalemate',
    threefoldTitle: 'Threefold Repetition',
    insufficientTitle: 'Insufficient Material',
    inCheckNotice: 'is in check!',
    inCheckTag: 'Check',
    turnTurnOf: 'Turn of',

    // Auth Pages
    loginTitle: 'Sign In',
    usernameLabel: 'Username',
    passwordLabel: 'Password',
    confirmPasswordLabel: 'Confirm Password',
    noAccountYet: 'Don\'t have an account?',
    haveAccountAlready: 'Already have an account?',
    registerTitle: 'Sign Up',

    // Game Lock Modal
    gameLockTitle: 'Match in Progress!',
    gameLockDesc: 'You are currently in an active game. You cannot navigate away unless you resign.',
    resumeMatchBtn: 'Resume Match',
    resignAndLeaveBtn: 'Resign & Leave',

    // Classifications
    brilliantTitle: 'Brilliant Move!',
    brilliantDesc: 'Move {san} is an exceptional, rare find! You unlocked a decisive winning advantage.',
    bestTitle: 'Best Move!',
    bestDesc: 'Move {san} perfectly matches Stockfish 19 top engine recommendation.',
    excellentTitle: 'Excellent Move',
    excellentDesc: 'Move {san} maintains a strong position according to Stockfish 19.',
    goodTitle: 'Good Move',
    goodDesc: 'Move {san} is a solid and safe move in this position.',
    inaccuracyTitle: 'Inaccuracy',
    inaccuracyDesc: 'Move {san} slightly reduces your advantage ({cpLoss} cp). {best}',
    mistakeTitle: 'Mistake',
    mistakeDesc: 'Move {san} misses a key tactical opportunity (lost {cpLoss} cp). {best}',
    blunderTitle: 'Blunder!',
    blunderDesc: 'Move {san} is a serious mistake (lost {cpLoss} cp) altering the game balance. {best}',
    playedMoveTitle: 'Played Move',
    playedMoveDesc: 'Move {san}.',
    suggestBestMove: 'Stockfish suggested {best} as the optimal move.',

    classBrilliant: 'Brilliant',
    classBest: 'Best',
    classExcellent: 'Excellent',
    classGood: 'Good',
    classInaccuracy: 'Inaccuracy',
    classMistake: 'Mistake',
    classBlunder: 'Blunder',
  }
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem('chess-lang') || 'vi'
    } catch {
      return 'vi'
    }
  })

  useEffect(() => {
    try {
      document.documentElement.lang = lang
      localStorage.setItem('chess-lang', lang)
    } catch {}
  }, [lang])

  useEffect(() => {
    const onStorage = () => {
      try {
        const stored = localStorage.getItem('chess-lang') || 'vi'
        setLangState(stored)
      } catch {}
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener('chess-lang-changed', onStorage)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('chess-lang-changed', onStorage)
    }
  }, [])

  const setLang = useCallback((newLang) => {
    const val = newLang === 'en' ? 'en' : 'vi'
    try {
      localStorage.setItem('chess-lang', val)
    } catch {}
    setLangState(val)
    window.dispatchEvent(new Event('chess-lang-changed'))
  }, [])

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === 'vi' ? 'en' : 'vi'
      try {
        localStorage.setItem('chess-lang', next)
      } catch {}
      window.dispatchEvent(new Event('chess-lang-changed'))
      return next
    })
  }, [])

  const t = useCallback(
    (key, params = {}) => {
      let str = TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.vi[key] ?? key
      if (typeof str === 'string' && params && typeof params === 'object') {
        Object.entries(params).forEach(([pKey, pVal]) => {
          str = str.replaceAll(`{${pKey}}`, pVal)
        })
      }
      return str
    },
    [lang]
  )

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    return {
      lang: 'vi',
      setLang: () => {},
      toggleLang: () => {},
      t: (key, params = {}) => {
        let str = TRANSLATIONS.vi[key] ?? key
        if (typeof str === 'string' && params && typeof params === 'object') {
          Object.entries(params).forEach(([pKey, pVal]) => {
            str = str.replaceAll(`{${pKey}}`, pVal)
          })
        }
        return str
      },
    }
  }
  return ctx
}
