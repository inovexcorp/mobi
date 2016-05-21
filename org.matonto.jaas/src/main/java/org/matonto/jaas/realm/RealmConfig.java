package org.matonto.jaas.realm;

import aQute.bnd.annotation.metatype.Meta;

@Meta.OCD
public interface RealmConfig {

    /**
     * Boolean enabling / disabling encrypted passwords.
     */
    @Meta.AD(id = "encryption.enabled", deflt = "false")
    boolean encryptionEnabled();

    /**
     * Encryption Service name. The default one is 'basic'. A more powerful one named 'jasypt' is available
     * when installing the encryption feature.
     */
    @Meta.AD(id = "encryption.name", deflt = "basic")
    String encryptionName();

    @Meta.AD(id = "encryption.prefix", deflt = "{CRYPT}")
    String encryptionPrefix();

    @Meta.AD(id = "encryption.suffix", deflt = "{CRYPT}")
    String encryptionSuffix();

    /**
     * Set the encryption algorithm to use in Karaf JAAS login module. Supported encryption algorithms follow:
     * <ul>
     *     <li>MD2</li>
     *     <li>MD5</li>
     *     <li>SHA-1</li>
     *     <li>SHA-256</li>
     *     <li>SHA-384</li>
     *     <li>SHA-512</li>
     * </ul>
     */
    @Meta.AD(id = "encryption.algorithm", deflt = "MD5")
    String encryptionAlgorithm();

    /**
     * Encoding of the encrypted password.
     * <ul>
     *     <li>hexadecimal</li>
     *     <li>base64</li>
     * </ul>
     */
    @Meta.AD(id = "encryption.encoding", deflt = "hexadecimal")
    String encryptionEncoding();
}
