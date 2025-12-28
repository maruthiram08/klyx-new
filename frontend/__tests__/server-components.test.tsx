
/**
 * Test Suite for Server Components Migration
 * Verifies the architectural correctness of new Server Components
 */

describe('Server Components Migration', () => {

    test('StockDetails page should be a Server Component', () => {
        const fs = require('fs');
        const pagePath = process.cwd() + '/app/stock/[code]/page.tsx';

        if (fs.existsSync(pagePath)) {
            const content = fs.readFileSync(pagePath, 'utf8');
            // Should NOT have 'use client'
            expect(content).not.toContain("'use client'");
            expect(content).not.toContain('"use client"');

            // Should be force-dynamic for fresh data
            expect(content).toContain("export const dynamic = 'force-dynamic'");

            // Should use async function
            expect(content).toContain('async function StockDetailsPage');
        } else {
            // Fail if file moved without update
            expect(true).toBe(false);
        }
    });

    test('StockDetails component should be a Client Component (for interactivity)', () => {
        const fs = require('fs');
        const componentPath = process.cwd() + '/components/StockDetails.tsx';

        if (fs.existsSync(componentPath)) {
            const content = fs.readFileSync(componentPath, 'utf8');
            // MUST have 'use client' because it uses hooks
            expect(content).toContain("'use client'");

            // Should accept initial data prop
            expect(content).toContain('initialFundamentals');
        } else {
            expect(true).toBe(false);
        }
    });

    test('Dashboard page should be a Server Component', () => {
        const fs = require('fs');
        const pagePath = process.cwd() + '/app/dashboard/page.tsx';

        if (fs.existsSync(pagePath)) {
            const content = fs.readFileSync(pagePath, 'utf8');
            // Should NOT have 'use client'
            expect(content).not.toContain("'use client'");

            // Should be force-dynamic for fresh data
            expect(content).toContain("export const dynamic = 'force-dynamic'");

            // Should contain fetching logic
            expect(content).toContain('async function getMarketData');
            expect(content).toContain('fetch');
        } else {
            expect(true).toBe(false);
        }
    });

});
