package org.matonto.rdf.orm.generate;

import org.junit.Test;

import junit.framework.TestCase;

public class TestPackageNamer {

	public static final String extendedDocumentMetadata = "http://cambridgesemantics.com/ontologies/2012/07/ExtendedDocumentMetadata";
	public static final String lillyCore = "http://www.lilly.com/ontologies/2015/SDP/LillyCore";
	public static final String lillyService = "http://www.lilly.com/ontologies/2015/SDP/LillyServices";
	public static final String lillySn6 = "http://www.lilly.com/ontologies/2015/SDP/LillyCore/SN6";

	@Test
	public void testGood() throws Exception {
		TestCase.assertEquals("com.cambridgesemantics.ontologies._2012._07.extendeddocumentmetadata",
				PackageNamer.packageFromUrl(extendedDocumentMetadata));
		TestCase.assertEquals("com.lilly.www.ontologies._2015.sdp.lillycore", PackageNamer.packageFromUrl(lillyCore));
		TestCase.assertEquals("com.lilly.www.ontologies._2015.sdp.lillyservices",
				PackageNamer.packageFromUrl(lillyService));

	}

}
