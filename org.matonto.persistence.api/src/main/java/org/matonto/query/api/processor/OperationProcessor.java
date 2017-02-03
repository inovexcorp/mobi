package org.matonto.query.api.processor;

/**
 * A unit of processing that occurs as part of the processing chain of an Operation.
 */
public interface OperationProcessor {

    /**
     * Executes the processing in the context of the operation.
     */
    void process();
}
