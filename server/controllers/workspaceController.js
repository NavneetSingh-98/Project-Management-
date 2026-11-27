
import prisma from "../configs/prisma.js";

// Get all workspaces for user
export const getUserWorkspaces = async (req, res) => {
    try {
        const { userId } = req.auth();

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const workspaces = await prisma.workspace.findMany({
            where: {
                members: {
                    some: { userId }
                }
            },
            include: {
                members: {
                    include: { user: true }
                },
                projects: {
                    include: {
                        tasks: {
                            include: {
                                assignee: true,
                                comments: {
                                    include: { user: true }
                                }
                            }
                        },
                        members: {
                            include: { user: true }
                        }
                    }
                },
                owner: true
            }
        });

        return res.json({ workspaces });

    } catch (error) {
        console.error("Get Workspaces Error:", error);

        return res.status(500).json({
            message: error.code || error.message
        });
    }
};


// Add member to workspace
export const addMember = async (req, res) => {
    try {
        const { userId } = req.auth();

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const { email, role, workspaceId, message } = req.body;

        if (!email || !workspaceId || !role) {
            return res.status(400).json({
                message: "Missing required parameters"
            });
        }

        if (!["ADMIN", "MEMBER"].includes(role)) {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email: email.trim() }
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Find workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { members: true }
        });

        if (!workspace) {
            return res.status(404).json({
                message: "Workspace not found"
            });
        }

        // Check admin privileges
        const isAdmin = workspace.members.some(
            member =>
                member.userId === userId &&
                member.role === "ADMIN"
        );

        if (!isAdmin) {
            return res.status(403).json({
                message: "You do not have admin privileges"
            });
        }

        // Check target user membership
        const existingMember = workspace.members.some(
            member => member.userId === user.id
        );

        if (existingMember) {
            return res.status(400).json({
                message: "User is already a member"
            });
        }

        // Add member
        const member = await prisma.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId,
                role,
                message
            }
        });

        return res.json({
            member,
            message: "Member added successfully"
        });

    } catch (error) {
        console.error("Add Member Error:", error);

        return res.status(500).json({
            message: error.code || error.message
        });
    }
};
