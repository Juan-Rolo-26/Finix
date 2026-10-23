// Isolated query checks: no database connection and no delivery.
const test = require('node:test');
const assert = require('node:assert/strict');
require('ts-node').register({ transpileOnly: true, skipProject: true, compilerOptions: { module: 'CommonJS', target: 'ES2022', experimentalDecorators: true, emitDecoratorMetadata: true } });
const { EmailMarketingService } = require('../apps/api/src/admin/email-marketing.service');
const matchesConsent = (where, user) => user.status === where.status && user.emailVerified === where.emailVerified && !user.email.endsWith(where.NOT.email.endsWith) && (user.emailPreferences === null || (user.emailPreferences.marketing && user.emailPreferences.analysis));
for (const audience of ['ALL', 'PRO']) {
  test(audience + ' excludes opt-outs and test accounts', () => {
    const service = new EmailMarketingService({}, {});
    const where = service.recipientWhere(audience);
    const subscribed = { email: 'subscriber@example.invalid', status: 'ACTIVE', emailVerified: true, investmentEmailNotifications: true, emailPreferences: { marketing: true, analysis: true } };
    assert.equal(matchesConsent(where, subscribed), true);
    assert.equal(where.investmentEmailNotifications, undefined);
    assert.equal(matchesConsent(where, { ...subscribed, investmentEmailNotifications: false }), true);
    for (const user of [
      { ...subscribed, emailPreferences: { marketing: false, analysis: true } },
      { ...subscribed, emailPreferences: { marketing: true, analysis: false } },
      { ...subscribed, email: 'fixture@example.test' },
      { ...subscribed, emailVerified: false },
      { ...subscribed, status: 'BANNED' },
    ]) assert.equal(matchesConsent(where, user), false);
    if (audience === 'PRO') { assert.equal(where.plan, 'PRO'); assert.equal(where.subscriptionStatus, 'ACTIVE'); }
    else assert.equal(where.plan, undefined);
  });
}

for (const [audience,preference] of [['DAILY','daily'],['WEEKLY','weekly']]) test(audience+' is available to every plan and respects its own email preference',()=>{
  const where=new EmailMarketingService({},{}).recipientWhere(audience);
  assert.equal(where.plan,undefined);assert.equal(where.subscriptionStatus,undefined);assert.equal(where.investmentEmailNotifications,undefined);
  assert.deepEqual(where.OR,[{emailPreferences:{is:null}},{emailPreferences:{is:{[preference]:true,marketing:true}}}]);
});
