package org.matonto.vfs.api;

/**
 * This is a simple {@link Exception} class that represents an issue that occurs during the asynchronous
 * processing of the children of a folder.
 */
public class AsynchronousProcessingException extends VirtualFilesystemException {

    /**
     * The identifier of the file that caused an issue.
     */
    private final String identifier;

    /**
     * Constructor for the {@link AsynchronousProcessingException}
     * @param msg The message to associate with this exception
     * @param identifier The ID of the folder {@link VirtualFile} that failed
     */
    public AsynchronousProcessingException(final String msg, final String identifier) {
        super(msg);
        this.identifier = identifier;
    }

    /**
     *
     * @return The ID of the {@link VirtualFile} that failed
     */
    public String getIdentifier() {
        return identifier;
    }
}
