// 注意：这个实现使用了 'crypto-js' 库，你需要在HTML中引入它
// <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"></script>

const TOTP = {
    getOTP: function(secret, time = Date.now()) {
        const timeStep = 30;
        let t = Math.floor(time / 1000 / timeStep);
        
        // 将时间转换为8字节的大端字节数组
        const timeBytes = new Uint8Array(8);
        for (let i = 0; i < 8; i++) {
            timeBytes[7 - i] = t & 0xff;
            t = Math.floor(t / 256);
        }

        // 解码base32密钥
        const key = this.base32ToArrayBuffer(secret);

        // 计算HMAC-SHA1
        const hmac = CryptoJS.HmacSHA1(CryptoJS.lib.WordArray.create(timeBytes), CryptoJS.lib.WordArray.create(key));
        const hmacResult = hmac.toString(CryptoJS.enc.Hex);

        // 获取HMAC的最后一个字节作为偏移量
        const offset = parseInt(hmacResult.slice(-1), 16);

        // 使用偏移量从HMAC中提取4个字节
        const otp = parseInt(hmacResult.substr(offset * 2, 8), 16) & 0x7fffffff;

        // 取模得到6位数字
        return (otp % 1000000).toString().padStart(6, '0');
    },

    base32ToArrayBuffer: function(base32) {
        const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = '';

        for (let i = 0; i < base32.length; i++) {
            const val = base32chars.indexOf(base32.charAt(i).toUpperCase());
            bits += val.toString(2).padStart(5, '0');
        }

        const bytes = new Uint8Array(Math.floor(bits.length / 8));
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
        }

        return bytes;
    },

    // 添加测试函数
    test: function() {
        // 测试向量来自 RFC 6238
        const testCases = [
            { secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', time: 59, expected: '287082' },
            { secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', time: 1111111109, expected: '081804' },
            { secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', time: 1111111111, expected: '050471' },
            { secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', time: 1234567890, expected: '005924' },
            { secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', time: 2000000000, expected: '279037' },
        ];

        for (let testCase of testCases) {
            const result = this.getOTP(testCase.secret, testCase.time * 1000);
            console.log(`Secret: ${testCase.secret}, Time: ${testCase.time}`);
            console.log(`Expected: ${testCase.expected}, Got: ${result}`);
            console.log(`Test ${result === testCase.expected ? 'PASSED' : 'FAILED'}`);
            console.log('---');
        }
    }
};

// 使用示例
const secret = 'JBSWY3DPEHPK3PXP';
const code = TOTP.getOTP(secret);
console.log('Current TOTP code:', code);

// 运行测试
TOTP.test();
