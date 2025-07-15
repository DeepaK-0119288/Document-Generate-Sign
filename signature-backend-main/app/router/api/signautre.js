import { Router } from 'express';
import { signatureServices } from '../../services/index.js';
import { checkLoginStatus } from '../../middleware/checkAuth.js';
import { signatureUpload } from '../../middleware/multer.js';
import { status } from '../../constants/index.js';
import path from 'path';
import fs from 'fs';

const router = Router();

router.post('/',checkLoginStatus,signatureUpload.single('signatureFile'),async (req, res, next) => {
        try {
            const userId = req.session.userId;
            if (!userId) {
                return res.status(403).json({ error: 'User not assigned' });
            }
            const signatureFile = req.file;
            if (!signatureFile) {
                return res.status(400).json({ error: 'Signature file is required' });
            }

            const relativePath = path.join('/uploads/signatures', path.basename(signatureFile.path));

            const signature = await signatureServices.save({
                userId,
                url: relativePath,
                createdBy: userId,
                updatedBy: userId,
                status: status.active,
            });

            return res.json({
                id: signature.id.toString(),
                userId: signature.userId.toString(),
                url: signature.url,
                createdBy: signature.createdBy,
                updatedBy: signature.updatedBy,
                status: signature.status,
            });
        } catch (error) {
            console.error('POST /api/signatures error:', error);
            next(error);
        }
    }
);

router.get('/', checkLoginStatus, async (req, res, next) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            return res.status(403).json({ error: 'User not assigned' });
        }

        // Explicitly pass status filter to findAllByUser
        const query = { status: status.active };
        const signatures = await signatureServices.findAllByUser(userId, query);

        const filteredSignatures = signatures.filter(sig => sig.status === status.active);

        return res.json(filteredSignatures);
    } catch (error) {
        console.error('GET /api/signatures error:', error);
        next(error);
    }
});

router.get('/image/:id', checkLoginStatus, async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.session.userId;
        if (!userId) {
            return res.status(403).json({ error: 'User not assigned' });
        }
        const signature = await signatureServices.findOne({ id, status: status.active });
        if (!signature) {
            return res.status(404).json({ error: 'Signature not found' });
        }
        const filePath = signature.url;
        const ext = path.extname(filePath);
        const contentType = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
        }[ext] || 'application/octet-stream';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', 'inline');
        fs.createReadStream(filePath).pipe(res);
    } catch (error) {
        console.error('GET /api/signatures/image/:id error:', error);
        next(error);
    }
});

router.delete('/:id', checkLoginStatus, async (req, res, next) => {
    try {
        const { id } = req.params;
        //('DELETE /api/signatures/:id', id);
        const userId = req.session.userId;
        if (!userId) {
            return res.status(403).json({ error: 'User not assigned' });
        }

        const signature = await signatureServices.findOne({ id, status: status.active });
        if (!signature) {
            return res.status(404).json({ error: 'Signature not found or unauthorized' });
        }

        const updatedSignature = await signatureServices.updateOne(
            { id, status: status.active },
            {
                $set: {
                    status: status.deleted,
                    updatedBy: userId,
                    updatedAt: new Date(),
                },
            }
        );

        if (!updatedSignature) {
            return res.status(404).json({ error: 'Signature not found' });
        }

        // Delete the file from the filesystem (commented out as per provided code)
        // const filePath = signature.url;
        // fs.unlink(filePath, (err) => {
        //     if (err) console.error('Failed to delete file:', err);
        // });

        return res.json({
            id: signature.id.toString(),
            userId: signature.userId.toString(),
            url: signature.url,
            createdBy: signature.createdBy,
            updatedBy: userId,
            status: status.deleted,
        });
    } catch (error) {
        console.error('DELETE /api/signatures/:id error:', error);
        next(error);
    }
});

export default router;