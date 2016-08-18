package org.matonto.rdf.orm.generate;

import org.junit.Test;

import static org.junit.Assert.assertEquals;

public class TestPackageNamer {

    private static final String extendedDocumentMetadata = "http://cambridgesemantics.com/ontologies/2012/07/ExtendedDocumentMetadata";
    private static final String lillyCore = "http://www.lilly.com/ontologies/2015/SDP/LillyCore";
    private static final String lillyService = "http://www.lilly.com/ontologies/2015/SDP/LillyServices";

	@Test
	public void testGood() throws Exception {
		assertEquals("com.cambridgesemantics.ontologies._2012._07.extendeddocumentmetadata",
				PackageNamer.packageFromUrl(extendedDocumentMetadata));
		assertEquals("com.lilly.www.ontologies._2015.sdp.lillycore", PackageNamer.packageFromUrl(lillyCore));
		assertEquals("com.lilly.www.ontologies._2015.sdp.lillyservices", PackageNamer.packageFromUrl(lillyService));
	}
}
