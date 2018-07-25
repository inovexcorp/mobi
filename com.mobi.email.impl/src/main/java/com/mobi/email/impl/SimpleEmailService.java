package com.mobi.email.impl;

/*-
 * #%L
 * com.mobi.email.impl
 * $Id:$
 * $HeadURL:$
 * %%
 * Copyright (C) 2016 - 2018 iNovex Information Systems, Inc.
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * #L%
 */

import aQute.bnd.annotation.component.Activate;
import aQute.bnd.annotation.component.Component;
import aQute.bnd.annotation.component.Modified;
import aQute.bnd.annotation.component.Reference;
import aQute.bnd.annotation.metatype.Configurable;
import com.mobi.email.api.EmailService;
import com.mobi.email.api.EmailServiceConfig;
import com.mobi.exception.MobiException;
import com.mobi.platform.config.api.server.Mobi;
import org.apache.commons.io.IOUtils;
import org.apache.commons.mail.EmailException;
import org.apache.commons.mail.ImageHtmlEmail;
import org.apache.commons.mail.resolver.DataSourceUrlResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLDecoder;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CompletableFuture;

@Component(
        designateFactory = EmailServiceConfig.class,
        name = SimpleEmailService.COMPONENT_NAME
)
public class SimpleEmailService implements EmailService {

    static final String COMPONENT_NAME = "com.mobi.email.api.EmailService";

    private static final Logger LOGGER = LoggerFactory.getLogger(SimpleEmailService.class);
    private static final String BODY_BINDING = "!|$BODY!|$";
    private static final String MESSAGE_BINDING = "!|$MESSAGE!|$";
    private static final String HOSTNAME_BINDING = "!|$HOSTNAME!|$";
    private EmailServiceConfig config;
    private Mobi mobiServer;
    private String emailTemplate;

    @Reference
    void setMobiServer(Mobi mobiServer) {
        this.mobiServer = mobiServer;
    }

    @Activate
    void activate(Map<String, Object> configuration) {
        config = Configurable.createConfigurable(EmailServiceConfig.class, configuration);
        try {
            InputStream input = new FileInputStream(URLDecoder.decode(System.getProperty("karaf.etc"), "UTF-8") + File.separator + config.emailTemplate());
            emailTemplate = IOUtils.toString(input, "UTF-8");
        } catch (IOException e) {
            throw new MobiException(e);
        }
    }

    @Modified
    void modified(Map<String, Object> configuration) {
        activate(configuration);
    }

    @Override
    public CompletableFuture<Set<String>> sendSimpleEmail(String subject, String message, String... userEmails) {
        String htmlBody = emailTemplate.substring(emailTemplate.indexOf(BODY_BINDING) + BODY_BINDING.length(),
                emailTemplate.lastIndexOf(BODY_BINDING));
        htmlBody = htmlBody.replace(MESSAGE_BINDING, message);
        return sendEmail(subject, htmlBody, userEmails);
    }

    @Override
    public CompletableFuture<Set<String>> sendEmail(String subject, String htmlMessage, String... userEmails) {
        CompletableFuture<Set<String>> emailSendResult = CompletableFuture.supplyAsync(() -> setUpEmail())
                .thenApply(email -> {
                    Set<String> invalidEmails = new HashSet<>();
                    email.setSubject(subject);
                    String htmlMsg = emailTemplate.replace(emailTemplate.substring(emailTemplate.indexOf(BODY_BINDING),
                            emailTemplate.lastIndexOf(BODY_BINDING) + BODY_BINDING.length()), htmlMessage);
                    if (mobiServer.getHostName().endsWith("/")) {
                        htmlMsg = htmlMsg.replace(HOSTNAME_BINDING, mobiServer.getHostName() + "mobi/index.html");
                    } else {
                        htmlMsg = htmlMsg.replace(HOSTNAME_BINDING, mobiServer.getHostName() + "/mobi/index.html");
                    }
                    try {
                        email.setHtmlMsg(htmlMsg);
                    } catch (EmailException e) {
                        throw new MobiException("Unable to set HTML Message content", e);
                    }
                    for (String userEmail : userEmails) {
                        try {
                            email.addBcc(userEmail);
                        } catch (EmailException e) {
                            invalidEmails.add(userEmail);
                            LOGGER.info("Invalid email address.", e);
                        }
                    }
                    try {
                        email.buildMimeMessage();
                        LOGGER.debug("Sending email to: " + Arrays.toString(userEmails));
                        LOGGER.debug("With a subject of: " + subject);
                        LOGGER.debug("And a body of: " + htmlMsg);
                    } catch (EmailException e) {
                        throw new MobiException("Unable to build MIME message.", e);
                    }
                    int repeatTries = 2;
                    while (repeatTries > 0) {
                        try {
                            email.sendMimeMessage();
                            break;
                        } catch (EmailException e) {
                            if (--repeatTries < 1) {
                                throw new MobiException("Could not send email.", e);
                            }
                            LOGGER.info("Could not send email. Attempting retry.");
                        }
                    }

                    return invalidEmails;
                });
        return emailSendResult;
    }

    private ImageHtmlEmail setUpEmail() {
        ImageHtmlEmail email = new ImageHtmlEmail();
        email.setHostName(config.smtpServer());
        email.setSmtpPort(config.port());
        email.setAuthentication(config.emailAddress(), config.emailPassword());

        URL imageBasePath = null;
        try {
            imageBasePath = new URL(config.imageBasePath());
        } catch (MalformedURLException e) {
            throw new MobiException(e);
        }

        email.setDataSourceResolver(new DataSourceUrlResolver(imageBasePath));

        if (config.security().equals("SSL") || config.security().equals("TLS")) {
            email.setSSLOnConnect(true);
            email.setSSLCheckServerIdentity(true);
        } else if (config.security().equals("STARTTLS")) {
            email.setStartTLSRequired(true);
        }

        try {
            email.setFrom(config.emailAddress());
        } catch (EmailException e) {
            throw new MobiException("Invalid 'From' email address.", e);
        }
        return email;
    }
}
