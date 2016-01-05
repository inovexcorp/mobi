package org.matonto.web.authentication;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jwt.SignedJWT;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.text.ParseException;

public class UITokenHttpContext extends AbstractTokenHttpContext {

    @Override
    protected boolean handleTokenFound(HttpServletRequest req, HttpServletResponse res, SignedJWT verifiedToken) throws IOException, ParseException, JOSEException {
        return true;
    }

    @Override
    protected boolean handleTokenMissing(HttpServletRequest req, HttpServletResponse res) throws IOException, JOSEException {
        // Create unauth token
        SignedJWT unauthToken = generateUnauthToken(req);
        res.addCookie(createSecureTokenCookie(unauthToken));
        return true;
    }
}
