package org.matonto.rest.util;

import org.glassfish.jersey.test.JerseyTestNg;

import javax.ws.rs.core.Application;

public abstract class MatontoRestTestNg extends JerseyTestNg.ContainerPerClassTest {
    @Override
    protected Application configure() {
        try {
            return configureApp();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    protected abstract Application configureApp() throws Exception;
}
