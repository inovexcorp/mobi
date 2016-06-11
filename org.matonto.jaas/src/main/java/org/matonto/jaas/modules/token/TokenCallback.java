package org.matonto.jaas.modules.token;

import javax.security.auth.callback.Callback;

public class TokenCallback implements Callback {

    private String tokenString;

    public String getTokenString() {
        return tokenString;
    }

    public void setTokenString(String tokenString) {
        this.tokenString = tokenString;
    }
}
