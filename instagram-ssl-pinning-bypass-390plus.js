'use strict'

var isTigonMNSServiceHolderHooked = false;

function hookLibLoading(){
    Java.perform(() => {
        var systemClass = Java.use("com.facebook.soloader.MergedSoMapping$Invoke_JNI_OnLoad");
        systemClass.libappstatelogger2_so.implementation = function(){
            if(isTigonMNSServiceHolderHooked == false){
                isTigonMNSServiceHolderHooked = true;
                hookTigonMNSServiceHolder();
                hookVerifyWithProofOfPossession();
            }
            var ret = this.libappstatelogger2_so();
            return ret;
        }
    });
}

function hookTigonMNSServiceHolder(){
    try {
        Java.perform(() => {
            const TigonMNSServiceHolder = Java.use("com.facebook.tigon.tigonmns.TigonMNSServiceHolder");
            TigonMNSServiceHolder.initHybrid.overload(
                "com.facebook.tigon.tigonmns.TigonMNSConfig",
                "java.lang.String",
                "com.facebook.tigon.tigonhuc.HucClient",
                "boolean"
            ).implementation = function(cfg, str, hucClient, boolVal) {
                cfg.setEnableCertificateVerificationWithProofOfPossession(false);
                cfg.setTrustSandboxCertificates(true);
                cfg.setForceHttp2(true);
                // Orijinal fonksiyonu orijinal argümanlarla çağırıyoruz
                return this.initHybrid(cfg, str, hucClient, boolVal);
            };
        });
        logger("[*][+] Hooked TigonMNSServiceHolder.initHybrid");
    } catch (e) {
        logger("[*][-] Failed to hook TigonMNSServiceHolder.initHybrid: " + e);
    }
}


function hookVerifyWithProofOfPossession() {
    try {
        Java.perform(() => {
            var TigonMNSConfigClass = Java.use("com.facebook.tigon.tigonmns.TigonMNSConfig");
            if (TigonMNSConfigClass.verifyWithProofOfPossession) {
                TigonMNSConfigClass.verifyWithProofOfPossession.implementation = function() {
                    logger("[*][+] verifyWithProofOfPossession called - bypassed");
                    return true;  // Bypass için başarılı dönüş
                }
                logger("[*][+] Hooked verifyWithProofOfPossession");
            } else {
                logger("[*][-] verifyWithProofOfPossession not found");
            }
        });
    } catch(e) {
        logger("[*][-] Failed to hook verifyWithProofOfPossession: " + e);
    }
}

function logger(message) {
    console.log(message);
    // Logcat görünmemesi için buraya ekleme yapmadım
}

hookLibLoading();

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
                checkClientTrusted(chain, authType) {},
                checkServerTrusted(chain, authType) {
                    logger("[*] checkServerTrusted bypassed");
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
            logger("[*] SSLContext.init called. Replacing TrustManager...");
        };
        logger("[*][+] Hooked SSLContext.init")
    } catch (e) {
        logger("[*][-] Failed to hook SSLContext.init")
    }
});
