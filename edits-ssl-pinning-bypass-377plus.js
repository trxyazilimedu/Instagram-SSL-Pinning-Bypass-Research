//alternative version. Might be useful if the regular version doesn't work
'use strict'

var isTigonMNSServiceHolderHooked = false;
function waitForModule(moduleName) {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            const module = Process.findModuleByName(moduleName);
            if (module != null) {
                if(isTigonMNSServiceHolderHooked == false){
                    isTigonMNSServiceHolderHooked = true;
                    hookTigonMNSServiceHolder();
                }
                clearInterval(interval);
                resolve(module);
            }
        }, 30);
    });
}

function hookTigonMNSServiceHolder(){
    try {
    Java.perform(() => {
        var TigonMNSServiceHolderClass = Java.use("com.facebook.tigon.tigonmns.TigonMNSServiceHolder");
		TigonMNSServiceHolderClass.initHybrid.overload("com.facebook.tigon.tigonmns.TigonMNSConfig", "java.lang.String", "long", "com.facebook.tigon.tigonhuc.HucClient", "boolean").implementation = function(cfg, str, l, hucClient, z){
            cfg.setEnableCertificateVerificationWithProofOfPossession(false);
            cfg.setTrustSandboxCertificates(true);
            cfg.setForceHttp2(true);
            var ret = this.initHybrid(cfg, str, l, hucClient, z);
			return ret;
		}
	});
        logger("[*][+] Hooked to TigonMNSServiceHolder.initHybrid")
    } catch (e) {
        logger("[*][-] Failed to TigonMNSServiceHolder.initHybrid")
    }
}

function logger(message) {
    console.log(message);
    //logging to logcat has been removed as it is visible to the instagram app
}


waitForModule("libliger.so");

//Universal Android SSL Pinning Bypass #2
Java.perform(function() {
    try {
        var array_list = Java.use("java.util.ArrayList");
        var ApiClient = Java.use('com.android.org.conscrypt.TrustManagerImpl');
        if (ApiClient.checkTrustedRecursive) {
            logger("[*][+] Hooked checkTrustedRecursive")
            ApiClient.checkTrustedRecursive.implementation = function(a1, a2, a3, a4, a5, a6) {
                var k = array_list.$new();
                return k;
            }
        } else {
            logger("[*][-] checkTrustedRecursive not Found")
        }
    } catch (e) {
        logger("[*][-] Failed to hook checkTrustedRecursive")
    }
});

Java.perform(function() {
    try {
        const x509TrustManager = Java.use("javax.net.ssl.X509TrustManager");
        const sSLContext = Java.use("javax.net.ssl.SSLContext");
        const TrustManager = Java.registerClass({
            implements: [x509TrustManager],
            methods: {
                checkClientTrusted(chain, authType) {
                },
                checkServerTrusted(chain, authType) {
                },
                getAcceptedIssuers() {
                    return [];
                },
            },
            name: "com.leftenter.instagram",
        });
        const TrustManagers = [TrustManager.$new()];
        const SSLContextInit = sSLContext.init.overload(
            "[Ljavax.net.ssl.KeyManager;", "[Ljavax.net.ssl.TrustManager;", "java.security.SecureRandom");
        SSLContextInit.implementation = function(keyManager, trustManager, secureRandom) {
            SSLContextInit.call(this, keyManager, TrustManagers, secureRandom);
        };
        logger("[*][+] Hooked SSLContextInit")
    } catch (e) {
        logger("[*][-] Failed to hook SSLContextInit")
    }
})