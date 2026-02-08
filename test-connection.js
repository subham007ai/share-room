
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gujzqixpiaidpsmphjpy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_OebwNp01GMsVJxzqtXkWCA_61I0k2Pm';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
    console.log('Testing Supabase connection...');
    try {
        // Test Select
        const { data: selectData, error: selectError } = await supabase.from('rooms').select('*').limit(1);
        if (selectError) {
            console.error('Select Error:', selectError);
        } else {
            console.log('Select Success! Data:', selectData);
        }

        // Test Insert
        const testCode = 'TEST' + Math.floor(Math.random() * 100);
        console.log(`Testing Insert with code ${testCode}...`);
        const { data: insertData, error: insertError } = await supabase.from('rooms').insert({
            code: testCode,
            name: 'Test Room',
            host_fingerprint: 'test-fingerprint'
        }).select();

        if (insertError) {
            console.error('Insert Error:', insertError);
        } else {
            console.log('Insert Success! Data:', insertData);

            // Allow some time for testing, then cleanup
            // const { error: deleteError } = await supabase.from('rooms').delete().eq('code', testCode);
            // if (deleteError) console.error('Cleanup Error:', deleteError);
        }

    } catch (err) {
        console.error('Exception:', err);
    }
}

test();
