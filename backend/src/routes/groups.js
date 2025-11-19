const express = require('express');
const multer = require('multer');
const verifySupabaseAuth = require('../middleware/verifySupabaseAuth');
const {
  createGroup,
  getUserGroups,
  getGroup,
  getGroupPhotos,
  addGroupMember,
  addMemberByEmail,
  getGroupMembers,
  removeGroupMember,
  deleteGroup,
  debugGroups,
  updateGroup,
  uploadGroupIcon
} = require('../controllers/groupController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed for group icons.'));
    }
  }
});

router.post('/', verifySupabaseAuth, createGroup);
router.get('/', verifySupabaseAuth, getUserGroups);
router.get('/debug', verifySupabaseAuth, debugGroups);
router.get('/:groupId', verifySupabaseAuth, getGroup);
router.patch('/:groupId', verifySupabaseAuth, updateGroup);
router.post('/:groupId/icon', verifySupabaseAuth, upload.single('icon'), uploadGroupIcon);
router.get('/:groupId/photos', verifySupabaseAuth, getGroupPhotos);
router.get('/:groupId/members', verifySupabaseAuth, getGroupMembers);
router.post('/:groupId/members', verifySupabaseAuth, addMemberByEmail);
router.post('/:groupId/add-member', verifySupabaseAuth, addGroupMember);
router.delete('/:groupId/members/:memberId', verifySupabaseAuth, removeGroupMember);
router.delete('/:groupId', verifySupabaseAuth, deleteGroup);

module.exports = router;