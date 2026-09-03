import re

with open('/home/juampi26/Finix/apps/api/prisma/schema.prisma', 'r') as f:
    schema = f.read()

# Remove the incorrectly added properties from User model
bad_props = """
  // Community features
  communityId        String?
  community          Community? @relation(fields: [communityId], references: [id])
  targetVisibility   String @default("PUBLIC") // PUBLIC, MEMBERS, PREMIUM_TIER
  requiredTierLevel  Int    @default(0)

  createdAt DateTime @default(now())"""

schema = schema.replace(bad_props, "  createdAt DateTime @default(now())", 1)

# Now find the true Post model and replace its createdAt
post_model_regex = re.compile(r'(model Post \{[\s\S]*?)(  createdAt DateTime @default\(now\)\))')

correct_post_props = r"""\1  // Community features
  communityId        String?
  community          Community? @relation(fields: [communityId], references: [id])
  targetVisibility   String @default("PUBLIC") // PUBLIC, MEMBERS, PREMIUM_TIER
  requiredTierLevel  Int    @default(0)

  createdAt DateTime @default(now())"""

schema = post_model_regex.sub(correct_post_props, schema)

with open('/home/juampi26/Finix/apps/api/prisma/schema.prisma', 'w') as f:
    f.write(schema)

print("Schema fixed!")
