const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const user = await prisma.user.findFirst();
    if (!user) return console.log("No user");
    try {
        const post = await prisma.post.create({
            data: {
                authorId: user.id,
                content: "test 123",
                type: "opinion"
            },
            include: {
                author: true
            }
        });
        console.log("Post created!", post.id);
    } catch (e) {
        console.error(e);
    }
}
main().then(() => prisma.$disconnect());
