import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertNovelSchema, insertCharacterSchema, insertRelationshipTypeSchema, insertRelationshipSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { randomBytes } from "crypto";

// Auth middleware
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // Configure multer for file uploads
  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(process.cwd(), 'uploads'));
    },
    filename: (req, file, cb) => {
      const randomName = randomBytes(16).toString('hex');
      const extension = path.extname(file.originalname);
      cb(null, `${randomName}${extension}`);
    }
  });
  
  const upload = multer({ 
    storage: multerStorage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: (req, file, cb) => {
      // Accept images only
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
    }
  });
  
  // Novel routes
  app.get("/api/novels", isAuthenticated, async (req, res, next) => {
    try {
      const novels = await storage.getNovels(req.user.id);
      res.json(novels);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/novels/:id", isAuthenticated, async (req, res, next) => {
    try {
      const novel = await storage.getNovel(parseInt(req.params.id));
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      // Check if user owns this novel
      if (novel.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(novel);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/novels", isAuthenticated, upload.single('coverImage'), async (req, res, next) => {
    try {
      let coverImage = null;
      if (req.file) {
        coverImage = `/uploads/${req.file.filename}`;
      }
      
      const novelData = {
        ...req.body,
        coverImage,
        userId: req.user.id
      };
      
      const validationResult = insertNovelSchema.safeParse(novelData);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid novel data", errors: validationResult.error.format() });
      }
      
      const novel = await storage.createNovel(validationResult.data);
      res.status(201).json(novel);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/novels/:id", isAuthenticated, upload.single('coverImage'), async (req, res, next) => {
    try {
      const novel = await storage.getNovel(parseInt(req.params.id));
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      // Check if user owns this novel
      if (novel.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      let coverImage = novel.coverImage;
      if (req.file) {
        coverImage = `/uploads/${req.file.filename}`;
      }
      
      const novelData = {
        ...req.body,
        coverImage
      };
      
      const updatedNovel = await storage.updateNovel(parseInt(req.params.id), novelData);
      res.json(updatedNovel);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/novels/:id", isAuthenticated, async (req, res, next) => {
    try {
      const novel = await storage.getNovel(parseInt(req.params.id));
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      // Check if user owns this novel
      if (novel.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteNovel(parseInt(req.params.id));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Character routes
  app.get("/api/novels/:novelId/characters", isAuthenticated, async (req, res, next) => {
    try {
      const novel = await storage.getNovel(parseInt(req.params.novelId));
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      // Check if user owns this novel
      if (novel.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const characters = await storage.getCharacters(parseInt(req.params.novelId));
      res.json(characters);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/characters", isAuthenticated, upload.single('avatar'), async (req, res, next) => {
    try {
      const novelId = parseInt(req.body.novelId);
      const novel = await storage.getNovel(novelId);
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      // Check if user owns this novel
      if (novel.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      let avatar = null;
      if (req.file) {
        avatar = `/uploads/${req.file.filename}`;
      }
      
      const characterData = {
        ...req.body,
        avatar,
        novelId
      };
      
      const validationResult = insertCharacterSchema.safeParse(characterData);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid character data", errors: validationResult.error.format() });
      }
      
      const character = await storage.createCharacter(validationResult.data);
      res.status(201).json(character);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/characters/:id", isAuthenticated, upload.single('avatar'), async (req, res, next) => {
    try {
      const character = await storage.getCharacter(parseInt(req.params.id));
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      const novel = await storage.getNovel(character.novelId);
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      // Check if user owns this novel
      if (novel.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      let avatar = character.avatar;
      if (req.file) {
        avatar = `/uploads/${req.file.filename}`;
      }
      
      const characterData = {
        ...req.body,
        avatar
      };
      
      const updatedCharacter = await storage.updateCharacter(parseInt(req.params.id), characterData);
      res.json(updatedCharacter);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/characters/:id", isAuthenticated, async (req, res, next) => {
    try {
      const character = await storage.getCharacter(parseInt(req.params.id));
      
      if (!character) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      const novel = await storage.getNovel(character.novelId);
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      // Check if user owns this novel
      if (novel.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteCharacter(parseInt(req.params.id));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Relationship Type routes
  app.get("/api/relationship-types", isAuthenticated, async (req, res, next) => {
    try {
      const relationshipTypes = await storage.getRelationshipTypes(req.user.id);
      res.json(relationshipTypes);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/relationship-types", isAuthenticated, async (req, res, next) => {
    try {
      const relationshipTypeData = {
        ...req.body,
        userId: req.user.id
      };
      
      const validationResult = insertRelationshipTypeSchema.safeParse(relationshipTypeData);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid relationship type data", errors: validationResult.error.format() });
      }
      
      const relationshipType = await storage.createRelationshipType(validationResult.data);
      res.status(201).json(relationshipType);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/relationship-types/:id", isAuthenticated, async (req, res, next) => {
    try {
      const relationshipType = await storage.getRelationshipType(parseInt(req.params.id));
      
      if (!relationshipType) {
        return res.status(404).json({ message: "Relationship type not found" });
      }
      
      // Check if user owns this relationship type or if it's a system default
      if (relationshipType.userId === 0) {
        return res.status(403).json({ message: "Cannot modify system default relationship types" });
      }
      
      if (relationshipType.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedRelationshipType = await storage.updateRelationshipType(parseInt(req.params.id), req.body);
      res.json(updatedRelationshipType);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/relationship-types/:id", isAuthenticated, async (req, res, next) => {
    try {
      const relationshipType = await storage.getRelationshipType(parseInt(req.params.id));
      
      if (!relationshipType) {
        return res.status(404).json({ message: "Relationship type not found" });
      }
      
      // Check if user owns this relationship type or if it's a system default
      if (relationshipType.userId === 0) {
        return res.status(403).json({ message: "Cannot delete system default relationship types" });
      }
      
      if (relationshipType.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteRelationshipType(parseInt(req.params.id));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Relationship routes
  app.get("/api/novels/:novelId/relationships", isAuthenticated, async (req, res, next) => {
    try {
      const novel = await storage.getNovel(parseInt(req.params.novelId));
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      // Check if user owns this novel
      if (novel.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const relationships = await storage.getRelationships(parseInt(req.params.novelId));
      res.json(relationships);
    } catch (error) {
      next(error);
    }
  });
  
  app.post("/api/relationships", isAuthenticated, async (req, res, next) => {
    try {
      const novelId = parseInt(req.body.novelId);
      const novel = await storage.getNovel(novelId);
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      // Check if user owns this novel
      if (novel.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Validate characters exist and belong to the same novel
      const sourceId = parseInt(req.body.sourceId);
      const targetId = parseInt(req.body.targetId);
      
      const sourceCharacter = await storage.getCharacter(sourceId);
      const targetCharacter = await storage.getCharacter(targetId);
      
      if (!sourceCharacter || !targetCharacter) {
        return res.status(404).json({ message: "Character not found" });
      }
      
      if (sourceCharacter.novelId !== novelId || targetCharacter.novelId !== novelId) {
        return res.status(400).json({ message: "Characters must belong to the same novel" });
      }
      
      // Validate relationship type exists
      const typeId = parseInt(req.body.typeId);
      const relationshipType = await storage.getRelationshipType(typeId);
      
      if (!relationshipType) {
        return res.status(404).json({ message: "Relationship type not found" });
      }
      
      const relationshipData = {
        sourceId,
        targetId,
        typeId,
        description: req.body.description,
        novelId
      };
      
      const validationResult = insertRelationshipSchema.safeParse(relationshipData);
      if (!validationResult.success) {
        return res.status(400).json({ message: "Invalid relationship data", errors: validationResult.error.format() });
      }
      
      const relationship = await storage.createRelationship(validationResult.data);
      res.status(201).json(relationship);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/relationships/:id", isAuthenticated, async (req, res, next) => {
    try {
      const relationship = await storage.getRelationship(parseInt(req.params.id));
      
      if (!relationship) {
        return res.status(404).json({ message: "Relationship not found" });
      }
      
      const novel = await storage.getNovel(relationship.novelId);
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      // Check if user owns this novel
      if (novel.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const updatedRelationship = await storage.updateRelationship(parseInt(req.params.id), req.body);
      res.json(updatedRelationship);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/relationships/:id", isAuthenticated, async (req, res, next) => {
    try {
      const relationship = await storage.getRelationship(parseInt(req.params.id));
      
      if (!relationship) {
        return res.status(404).json({ message: "Relationship not found" });
      }
      
      const novel = await storage.getNovel(relationship.novelId);
      
      if (!novel) {
        return res.status(404).json({ message: "Novel not found" });
      }
      
      // Check if user owns this novel
      if (novel.userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.deleteRelationship(parseInt(req.params.id));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Admin user management
  app.get("/api/admin/users", isAdmin, async (req, res, next) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords from response
      const usersResponse = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersResponse);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/admin/users/:id", isAdmin, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't allow changing the user's password through this route
      const { password, ...userData } = req.body;
      
      const updatedUser = await storage.updateUser(userId, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  app.delete("/api/admin/users/:id", isAdmin, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Don't allow deleting yourself
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Cannot delete yourself" });
      }
      
      const deleted = await storage.deleteUser(userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  // User profile update route
  app.patch("/api/users/:id", isAuthenticated, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Only allow users to update their own profile, unless they're an admin
      if (userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "You don't have permission to update this profile" });
      }
      
      const { username, email } = req.body;
      
      // Check if username is already taken by another user
      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username is already taken" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, { username, email });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  // Change password route
  app.post("/api/users/:id/change-password", isAuthenticated, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Only allow users to change their own password, unless they're an admin
      if (userId !== req.user.id && !req.user.isAdmin) {
        return res.status(403).json({ message: "You don't have permission to change this password" });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      // Verify current password
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Skip password verification for admins changing other users' passwords
      if (userId === req.user.id) {
        // Use the comparePasswords function from auth.ts
        // Since we can't directly import it here, we'll need to implement a simpler version
        const { scrypt, timingSafeEqual } = await import('crypto');
        const { promisify } = await import('util');
        const scryptAsync = promisify(scrypt);
        
        const [hashedPassword, salt] = user.password.split('.');
        const hashedInputBuffer = Buffer.from(hashedPassword, 'hex');
        const suppliedInputBuffer = await scryptAsync(currentPassword, salt, 64) as Buffer;
        
        if (!timingSafeEqual(hashedInputBuffer, suppliedInputBuffer)) {
          return res.status(401).json({ message: "Current password is incorrect" });
        }
      }
      
      // Hash the new password
      const { scrypt, randomBytes } = await import('crypto');
      const { promisify } = await import('util');
      const scryptAsync = promisify(scrypt);
      
      const salt = randomBytes(16).toString('hex');
      const hashBuffer = await scryptAsync(newPassword, salt, 64) as Buffer;
      const hashedPassword = `${hashBuffer.toString('hex')}.${salt}`;
      
      // Update the password
      const updatedUser = await storage.updateUser(userId, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Create the HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
