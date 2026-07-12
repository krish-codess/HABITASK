const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getFriends = async (req, res, next) => {
  try {
    const friends = await prisma.friend.findMany({
      where: { userId: req.user.id },
      include: { friend: { select: { id: true, name: true, email: true } } },
    });
    res.json(friends.map((f) => f.friend));
  } catch (err) {
    next(err);
  }
};

const sendRequest = async (req, res, next) => {
  try {
    const { receiverId } = req.body;
    if (!receiverId) return res.status(400).json({ message: 'receiverId is required' });
    if (receiverId === req.user.id) return res.status(400).json({ message: 'Cannot send request to yourself' });

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) return res.status(404).json({ message: 'User not found' });

    const existing = await prisma.friendRequest.findUnique({
      where: { senderId_receiverId: { senderId: req.user.id, receiverId } },
    });
    if (existing) return res.status(400).json({ message: 'Request already sent' });

    const alreadyFriends = await prisma.friend.findUnique({
      where: { userId_friendId: { userId: req.user.id, friendId: receiverId } },
    });
    if (alreadyFriends) return res.status(400).json({ message: 'Already friends' });

    const request = await prisma.friendRequest.create({
      data: { senderId: req.user.id, receiverId },
      include: { receiver: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
};

const getPendingRequests = async (req, res, next) => {
  try {
    const requests = await prisma.friendRequest.findMany({
      where: { receiverId: req.user.id, status: 'pending' },
      include: { sender: { select: { id: true, name: true, email: true } } },
    });
    res.json(requests);
  } catch (err) {
    next(err);
  }
};

const acceptRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await prisma.friendRequest.findFirst({ where: { id, receiverId: req.user.id, status: 'pending' } });
    if (!request) return res.status(404).json({ message: 'Request not found' });

    await prisma.$transaction([
      prisma.friendRequest.update({ where: { id }, data: { status: 'accepted' } }),
      prisma.friend.create({ data: { userId: req.user.id, friendId: request.senderId } }),
      prisma.friend.create({ data: { userId: request.senderId, friendId: req.user.id } }),
    ]);

    res.json({ message: 'Friend request accepted' });
  } catch (err) {
    next(err);
  }
};

const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await prisma.friendRequest.findFirst({ where: { id, receiverId: req.user.id } });
    if (!request) return res.status(404).json({ message: 'Request not found' });
    await prisma.friendRequest.update({ where: { id }, data: { status: 'rejected' } });
    res.json({ message: 'Friend request rejected' });
  } catch (err) {
    next(err);
  }
};

const unfriend = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.friend.deleteMany({
      where: { OR: [{ userId: req.user.id, friendId: id }, { userId: id, friendId: req.user.id }] },
    });
    res.json({ message: 'Unfriended' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFriends, sendRequest, getPendingRequests, acceptRequest, rejectRequest, unfriend };
