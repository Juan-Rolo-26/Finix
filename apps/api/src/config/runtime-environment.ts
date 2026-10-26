import { config } from 'dotenv';
import { resolve } from 'path';

// PM2 resurrects its saved environment after a machine restart. The private
// configuration shipped with this release must win over stale saved values.
// Load before AppModule so provider constants see the same configuration.
config({
    path: resolve(__dirname, '../../.env'),
    override: process.env.NODE_ENV === 'production',
    quiet: true,
});
