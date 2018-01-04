package com.mobi.rdf.orm.test;

/**
 * This {@link RuntimeException} extension represents when there is an issue that occurs in the
 * {@link OrmEnabledTestCase}.  When making use of this framework, this exception may be thrown from either the
 * initialization of the {@link com.mobi.rdf.orm.OrmFactory} system initialization, or when trying to work
 * with the {@link com.mobi.rdf.orm.OrmFactory}s in your runtime.
 */
public class OrmTestCaseException extends RuntimeException {

    public OrmTestCaseException(String msg) {
        super(msg);
    }

    public OrmTestCaseException(String msg, Throwable cause) {
        super(msg, cause);
    }

}
