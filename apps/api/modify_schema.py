import re

with open('/home/juampi26/Finix/apps/api/prisma/schema.prisma', 'r') as f:
    schema = f.read()

# 1. Modify Post Model
post_addition = """
  // Community features
  communityId        String?
  community          Community? @relation(fields: [communityId], references: [id])
  targetVisibility   String @default("PUBLIC") // PUBLIC, MEMBERS, PREMIUM_TIER
  requiredTierLevel  Int    @default(0)

  createdAt DateTime @default(now())"""
schema = schema.replace('  createdAt DateTime @default(now())', post_addition, 1)

# 2. Modify Community Model
community_old = """model Community {
  id          String @id @default(uuid())
  creatorId   String
  creator     User   @relation("CommunityCreator", fields: [creatorId], references: [id])
  name        String
  description String
  category    String // Actions, Crypto, ETFs, Argentina, USA

  imageUrl  String?
  bannerUrl String?

  isPaid      Boolean @default(false)
  price       Decimal @default(0)
  billingType String  @default("monthly") // monthly | yearly
  maxMembers  Int? // nullable

  members  CommunityMember[]
  posts    CommunityPost[]
  payments CommunityPayment[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  resources CommunityResource[]
}"""

community_new = """model Community {
  id          String @id @default(uuid())
  creatorId   String
  creator     User   @relation("CommunityCreator", fields: [creatorId], references: [id])
  name        String
  description String
  category    String // Actions, Crypto, ETFs, Argentina, USA

  imageUrl  String?
  bannerUrl String?

  privacyType String  @default("PUBLIC") // PUBLIC, PRIVATE, EXCLUSIVE
  rules       String?
  maxMembers  Int? // nullable

  members   CommunityMember[]
  posts     Post[]
  events    CommunityEvent[]
  plans     CommunityPlan[]
  payments  CommunityPayment[]
  resources CommunityResource[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model CommunityPlan {
  id            String      @id @default(uuid())
  communityId   String
  community     Community   @relation(fields: [communityId], references: [id])
  name          String      // Ej: "VIP", "Pro"
  price         Decimal
  interval      String      @default("monthly") // "monthly", "yearly" o "one_time"
  features      String      // JSON array beneficios
  tierLevel     Int         @default(0) // 0 (Free), 10 (Pro), 20 (VIP)
  stripePriceId String?

  members       CommunityMember[]
}

model CommunityEvent {
  id                String    @id @default(uuid())
  communityId       String
  community         Community @relation(fields: [communityId], references: [id])
  title             String
  description       String?
  eventDate         DateTime
  requiredTierLevel Int       @default(0)
  link              String?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}"""

schema = schema.replace(community_old, community_new)

# 3. Modify CommunityMember
member_old = """  stripeSubscriptionId String?
  expiresAt            DateTime?

  joinedAt DateTime @default(now())"""

member_new = """  stripeSubscriptionId String?
  expiresAt            DateTime?

  planId               String?
  plan                 CommunityPlan? @relation(fields: [planId], references: [id])

  joinedAt DateTime @default(now())"""

schema = schema.replace(member_old, member_new)

# 4. Modify CommunityResource
resource_old = """  isPublic    Boolean   @default(false)
  authorId    String?"""

resource_new = """  isPublic          Boolean   @default(false)
  requiredTierLevel Int       @default(0)
  authorId          String?"""

schema = schema.replace(resource_old, resource_new)

# 5. Erase CommunityPost completely
community_post_regex = re.compile(r'model CommunityPost \{[\s\S]*?\}')
schema = community_post_regex.sub('', schema)

with open('/home/juampi26/Finix/apps/api/prisma/schema.prisma', 'w') as f:
    f.write(schema)

print("Schema updated via regex scripts!")
